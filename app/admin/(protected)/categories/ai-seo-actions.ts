"use server";

import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { invalidateSitemap } from "@/lib/sitemap-cache";
import Category from "@/models/Category";
import { generateCategorySeo, validateSeoFields } from "@/lib/ai/category-seo-generator";
import { SEO_FIELDS, type SeoField } from "@/lib/category-seo";
import type { GenerateSeoResult, ApplySeoResult } from "@/lib/ai/types";

/**
 * Step 1 — generate a DRAFT for one category. Nothing is written to the
 * database here; the admin reviews the preview and applies it separately.
 * Admin-only (same env-based admin session as every other category action).
 */
export async function generateCategorySeoAction(
  categoryId: string,
  mode: "fill" | "rewrite"
): Promise<GenerateSeoResult> {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { ok: false, error: err.message, retryable: false };
  }
  if (!mongoose.isValidObjectId(categoryId) || (mode !== "fill" && mode !== "rewrite")) {
    return { ok: false, error: "درخواست نامعتبر است.", retryable: false };
  }
  try {
    return await generateCategorySeo(categoryId, mode);
  } catch (err: any) {
    console.error("generateCategorySeoAction failed:", err);
    return { ok: false, error: err?.message ?? "خطای ناشناخته", retryable: true };
  }
}

/**
 * Step 2 — save an admin-approved draft. The draft is re-validated here
 * (never trusted from the client). A field that already has content is only
 * replaced when `overwrite` is true (the admin explicitly confirmed it).
 * Only the five SEO fields are touched: slug, name, parent, URLs stay as-is.
 */
export async function applyCategorySeoAction(
  categoryId: string,
  draft: unknown,
  fields: string[],
  overwrite: boolean
): Promise<ApplySeoResult> {
  try {
    await requireAdmin();
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
  if (!mongoose.isValidObjectId(categoryId)) return { ok: false, error: "دسته‌بندی نامعتبر است." };
  const wanted = SEO_FIELDS.filter((f) => fields.includes(f));
  if (wanted.length === 0) return { ok: false, error: "هیچ فیلدی برای ذخیره انتخاب نشده است." };

  const v = validateSeoFields(draft, wanted);
  if (!v.ok) return { ok: false, error: `اطلاعات نامعتبر: ${v.errors.join("؛ ")}` };

  await connectToDatabase();
  const cat: any = await Category.findById(categoryId).lean();
  if (!cat) return { ok: false, error: "دسته‌بندی پیدا نشد." };

  const hasExisting = (f: SeoField) =>
    f === "faq" ? (cat.faq ?? []).length > 0 : Boolean(String(cat[f] ?? "").trim());

  const set: Record<string, unknown> = {};
  const applied: SeoField[] = [];
  const skipped: SeoField[] = [];
  for (const f of wanted) {
    if (hasExisting(f) && !overwrite) {
      skipped.push(f);
      continue;
    }
    set[f] = (v.data as any)[f];
    applied.push(f);
  }
  if (applied.length > 0) {
    await Category.updateOne({ _id: categoryId }, { $set: set });
    revalidatePath(`/categories/${cat.slug}`);
    revalidatePath("/admin/categories");
    revalidateTag("categories");
    invalidateSitemap(); // content can make a thin category indexable
  }
  return { ok: true, applied, skipped };
}
