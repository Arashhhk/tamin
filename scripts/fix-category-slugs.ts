/**
 * اجرا کنید تا دسته‌بندی‌هایی که قبل از رفع باگ اسلاگ ساخته شده‌اند
 * (مثل «صنعتی» یا «فولادی» که با حروف فارسی خام در URL ذخیره شده
 * بودند و باعث خطای «صفحه یافت نشد» می‌شدند) با اسلاگ درست
 * (لاتین/ASCII) به‌روزرسانی شوند — بدون پاک‌کردن و دوباره‌ساختن، پس
 * هیچ درخواست خرید وابسته‌ای از دست نمی‌رود.
 *
 *   npm run fix-slugs
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import Category from "../models/Category";
import { slugifyBase } from "../lib/slugify";

async function generateUniqueSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base || "dastebandi";
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Category.findOne({
      slug: candidate,
      _id: { $ne: excludeId }
    })
      .select("_id")
      .lean();
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${base || "dastebandi"}-${attempt}`;
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI در .env.local تنظیم نشده است.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("متصل به MongoDB شد.\n");

  const categories = await Category.find();
  let fixedCount = 0;

  for (const cat of categories) {
    // Non-ASCII means the slug has any character outside a-z0-9-.
    const isAscii = /^[a-z0-9-]+$/.test(cat.slug);
    if (isAscii) continue;

    const base = slugifyBase(cat.name) || slugifyBase(cat.slug);
    const newSlug = await generateUniqueSlug(base, String(cat._id));

    console.log(`اصلاح شد: «${cat.name}»  ${cat.slug}  →  ${newSlug}`);
    cat.slug = newSlug;
    await cat.save();
    fixedCount++;
  }

  if (fixedCount === 0) {
    console.log("هیچ دسته‌بندی خراب‌شده‌ای پیدا نشد — همه‌چیز از قبل درست بوده.");
  } else {
    console.log(`\n✅ ${fixedCount} دسته‌بندی اصلاح شد.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
