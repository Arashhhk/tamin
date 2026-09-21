"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { slugifyBase } from "@/lib/slugify";
import Category from "@/models/Category";
import Rfq from "@/models/Rfq";

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

  const inUse = await Rfq.countDocuments({ category: id });
  if (inUse > 0) {
    throw new Error(
      `این دسته‌بندی ${inUse} درخواست خرید فعال دارد و قابل حذف نیست.`
    );
  }

  await Category.findByIdAndDelete(id);
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
  if (parentId !== null) {
    const p = String(parentId).trim();
    if (p === id) throw new Error("یک دسته‌بندی نمی‌تواند زیرمجموعه‌ی خودش باشد");
    update.parent = p || null;
  }

  await Category.findByIdAndUpdate(id, update);
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}
