"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Category from "@/models/Category";
import Rfq from "@/models/Rfq";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "Package").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const parentId = String(formData.get("parent") || "").trim();

  if (!name) throw new Error("نام دسته‌بندی الزامی است");

  const slug = slugify(slugInput || name);
  const existing = await Category.findOne({ slug });
  if (existing) throw new Error("این نامک (slug) قبلاً استفاده شده است");

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
