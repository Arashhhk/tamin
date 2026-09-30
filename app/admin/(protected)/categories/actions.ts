"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { slugifyBase } from "@/lib/slugify";
import Category from "@/models/Category";
import Rfq from "@/models/Rfq";
import { openRfqFilter } from "@/lib/rfq-status";
import { parseFaqText } from "@/lib/category-seo";
import { invalidateSitemap } from "@/lib/sitemap-cache";

/**
 * Category slugs stay short and readable (unlike RFQ slugs, which
 * always get a unique suffix because there are thousands of them) —
 * categories are few and rarely renamed, so a clean "sanati" is nicer
 * than "sanati-m3x7k2". Collisions are resolved with a plain numeric
 * suffix (sanati-2, sanati-3, ...) instead.
 */
async function generateUniqueCategorySlug(input: string, excludeId?: string): Promise<string> {
  const base = slugifyBase(input) || "dastebandi";
  let candidate = base;
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: any = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Category.findOne(query).select("_id").lean();
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "Package").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const parentId = String(formData.get("parent") || "").trim();

  if (!name) throw new Error("نام دسته‌بندی الزامی است");

  // Always transliterated to ASCII — raw Persian/Arabic characters in a
  // URL slug are what caused the "صفحه یافت نشد" bug (see lib/slugify.ts).
  const slug = await generateUniqueCategorySlug(slugInput || name);

  await Category.create({ name, slug, icon, parent: parentId || null });
  // Header, Footer and the sitemap cache the category list for up to
  // an hour (tag "categories") — without this an admin edit would
  // take that long to show up in the nav.
  revalidateTag("categories");
  invalidateSitemap();
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("شناسه نامعتبر است");

  const childCount = await Category.countDocuments({ parent: id });
  if (childCount > 0) {
    throw new Error(`این دسته‌بندی ${childCount} زیردسته دارد؛ ابتدا آن‌ها را حذف یا منتقل کنید.`);
  }

  // Only auctions that are still live (open, or a deal being carried out:
  // selecting / in_progress) block deletion. Finished ones — completed,
  // cancelled, expired, or "active" with its time already up — don't.
  const blocking = await Rfq.countDocuments({
    category: id,
    $or: [openRfqFilter(), { status: { $in: ["selecting", "in_progress"] } }]
  });
  if (blocking > 0) {
    throw new Error(
      `این دسته‌بندی ${blocking} درخواست فعال یا در حال انجام دارد و قابل حذف نیست.`
    );
  }

  // Finished RFQs keep their public pages (archive), so they must not be
  // left pointing at a deleted category: move them to the parent category
  // when there is one. (Pages also tolerate a missing category.)
  const doomed = await Category.findById(id).select("parent").lean();
  if (doomed?.parent) {
    await Rfq.updateMany({ category: id }, { $set: { category: doomed.parent } });
  }

  await Category.findByIdAndDelete(id);
  // Header, Footer and the sitemap cache the category list for up to
  // an hour (tag "categories") — without this an admin edit would
  // take that long to show up in the nav.
  revalidateTag("categories");
  invalidateSitemap();
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();
  const parentId = formData.get("parent");
  if (!id || !name) throw new Error("اطلاعات نامعتبر است");

  const update: any = { name, icon };

  // Slug (نامک) edit. The URL changes, so the old slug is remembered and
  // /categories/<old> permanently redirects to the new one (SEO-safe).
  const slugInput = String(formData.get("slug") || "").trim();
  let oldSlugForRevalidate: string | null = null;
  if (slugInput) {
    const current = await Category.findById(id).select("slug oldSlugs").lean();
    if (current && slugifyBase(slugInput) !== current.slug) {
      const newSlug = await generateUniqueCategorySlug(slugInput, id);
      if (newSlug !== current.slug) {
        update.slug = newSlug;
        update.oldSlugs = [...(current.oldSlugs ?? []).filter((s) => s !== newSlug), current.slug];
        oldSlugForRevalidate = current.slug;
      }
    }
  }
  // Optional SEO content: only touched when the form actually sent the fields.
  if (formData.get("seoTitle") !== null) {
    update.seoTitle = String(formData.get("seoTitle") || "").trim().slice(0, 70);
    update.seoDescription = String(formData.get("seoDescription") || "").trim().slice(0, 170);
    update.description = String(formData.get("description") || "").trim().slice(0, 1500);
    update.seoContent = String(formData.get("seoContent") || "").trim().slice(0, 8000);
    update.faq = parseFaqText(String(formData.get("faq") || ""));
  }
  if (parentId !== null) {
    const p = String(parentId).trim();
    if (p === id) throw new Error("یک دسته‌بندی نمی‌تواند زیرمجموعه‌ی خودش باشد");
    if (p) {
      // With unlimited nesting depth now allowed, a category could be
      // moved under one of its OWN descendants (e.g. making "دیجیتال"
      // a child of "سامسونگ" when سامسونگ is already under دیجیتال) —
      // that's a cycle, not just a self-reference, so walk up from the
      // proposed new parent and reject if we ever reach `id`.
      let cursor = await Category.findById(p).select("parent").lean();
      let depth = 0;
      while (cursor?.parent && depth < 20) {
        if (String(cursor.parent) === id) {
          throw new Error("یک دسته‌بندی نمی‌تواند زیرمجموعه‌ی یکی از زیردسته‌های خودش باشد");
        }
        cursor = await Category.findById(cursor.parent).select("parent").lean();
        depth += 1;
      }
    }
    update.parent = p || null;
  }

  const updated = await Category.findByIdAndUpdate(id, update, { new: true }).select("slug").lean();
  if (updated?.slug) revalidatePath(`/categories/${updated.slug}`);
  if (oldSlugForRevalidate) revalidatePath(`/categories/${oldSlugForRevalidate}`);
  // Header, Footer and the sitemap cache the category list for up to
  // an hour (tag "categories") — without this an admin edit would
  // take that long to show up in the nav.
  revalidateTag("categories");
  invalidateSitemap();
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}
