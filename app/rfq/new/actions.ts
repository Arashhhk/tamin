"use server";

import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Rfq from "@/models/Rfq";
import Category from "@/models/Category";

function slugify(title: string) {
  const base = title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");
  return `${base}-${Date.now().toString(36)}`;
}

export async function createRfq(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "buyer") {
    throw new Error("فقط خریداران می‌توانند درخواست خرید ثبت کنند");
  }

  await connectToDatabase();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categorySlug = String(formData.get("category") || "");
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit") || "").trim();
  const province = String(formData.get("province") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const durationHours = Number(formData.get("duration") || 24);

  if (!title || !description || !categorySlug || !quantity || !unit || !province || !city) {
    throw new Error("همه فیلدهای الزامی را پر کنید");
  }

  const category = await Category.findOne({ slug: categorySlug });
  if (!category) throw new Error("دسته‌بندی نامعتبر است");

  const rfq = await Rfq.create({
    title,
    slug: slugify(title),
    description,
    category: category._id,
    buyer: session.userId,
    quantity,
    unit,
    province,
    city,
    status: "active",
    expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000)
  });

  redirect(`/rfq/${rfq.slug}`);
}
