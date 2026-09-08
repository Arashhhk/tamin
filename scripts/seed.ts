import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Category from "../models/Category";
import Rfq from "../models/Rfq";
import Bid from "../models/Bid";
import { categoryTree } from "../lib/category-tree";

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI در .env.local تنظیم نشده است.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("متصل به MongoDB شد.");

  // Drops any index that no longer matches the current schema (e.g. a
  // leftover unique index on a field like `phone` from an older version
  // of the model) and creates any missing ones. Prevents stale-index
  // duplicate-key errors like E11000 on phone_1.
  await Promise.all([
    User.syncIndexes(),
    Category.syncIndexes(),
    Rfq.syncIndexes(),
    Bid.syncIndexes()
  ]);
  console.log("ایندکس‌های دیتابیس با schema فعلی هماهنگ شد.");

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Rfq.deleteMany({}),
    Bid.deleteMany({})
  ]);
  console.log("داده‌های قبلی پاک شد.");

  const categoryDocs = [];
  for (const parent of categoryTree) {
    const parentDoc = await Category.create({ name: parent.name, slug: parent.slug, icon: parent.icon, parent: null });
    categoryDocs.push(parentDoc);
    for (const child of parent.children) {
      const childDoc = await Category.create({ name: child.name, slug: child.slug, icon: child.icon, parent: parentDoc._id });
      categoryDocs.push(childDoc);
    }
  }
  const categories = categoryDocs;
  console.log(`${categories.length} دسته‌بندی ایجاد شد (${categoryTree.length} دسته اصلی + ${categories.length - categoryTree.length} زیردسته).`);

  const passwordHash = await bcrypt.hash("password123", 12);

  const buyer = await User.create({
    name: "علی محمدی",
    email: "buyer@tamin.ir",
    passwordHash,
    role: "buyer",
    province: "تهران",
    city: "تهران",
    verified: true,
    rating: 4.6,
    dealsCompleted: 12
  });

  const sellersData = [
    { name: "فولاد پارس", email: "seller1@tamin.ir", province: "تهران", city: "تهران", rating: 4.9, dealsCompleted: 2456 },
    { name: "صنعت گستر ایرانیان", email: "seller2@tamin.ir", province: "اصفهان", city: "اصفهان", rating: 4.8, dealsCompleted: 1890 },
    { name: "تجهیز صنعت", email: "seller3@tamin.ir", province: "آذربایجان شرقی", city: "تبریز", rating: 4.8, dealsCompleted: 1567 }
  ];
  const sellers = await User.insertMany(
    sellersData.map((s) => ({ ...s, passwordHash, role: "seller", verified: true }))
  );
  console.log(`${sellers.length + 1} کاربر ایجاد شد (۱ خریدار + ${sellers.length} فروشنده).`);

  const admin = await User.create({
    name: "مدیر سیستم",
    email: "admin@tamin.ir",
    passwordHash,
    role: "admin",
    verified: true
  });

  const findCat = (slug: string) => categories.find((c) => c.slug === slug)!._id;

  const rfqsData = [
    {
      title: "ورق استیل ۳۰۴ مواد اولیه",
      slug: "steel-sheet-304-tehran",
      description: "درخواست خرید ۱۰۰۰ کیلوگرم ورق استیل ضدزنگ ۳۰۴، ضخامت ۲ میلی‌متر، تحویل تهران.",
      category: findCat("metals"),
      quantity: 1000,
      unit: "کیلوگرم",
      province: "تهران",
      city: "تهران",
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      bids: [
        { seller: sellers[0]._id, price: 285000000, note: "تحویل ۲ روزه" },
        { seller: sellers[1]._id, price: 292000000, note: "" }
      ]
    },
    {
      title: "دستگاه جوش صنعتی",
      slug: "industrial-welder-isfahan",
      description: "خرید ۲ دستگاه جوش صنعتی اینورتری برای خط تولید، تحویل اصفهان.",
      category: findCat("machinery"),
      quantity: 2,
      unit: "دستگاه",
      province: "اصفهان",
      city: "اصفهان",
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      bids: [{ seller: sellers[1]._id, price: 40500000, note: "گارانتی ۱۸ ماهه" }]
    },
    {
      title: "کابل برق ۳×۶",
      slug: "power-cable-3x6-tabriz",
      description: "درخواست خرید ۵۰۰ متر کابل برق ۳×۶ استاندارد، تحویل تبریز.",
      category: findCat("electrical-wiring"),
      quantity: 500,
      unit: "متر",
      province: "آذربایجان شرقی",
      city: "تبریز",
      expiresAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      bids: [
        { seller: sellers[2]._id, price: 128000000, note: "" },
        { seller: sellers[0]._id, price: 131500000, note: "ارسال رایگان" }
      ]
    },
    {
      title: "پروفیل آهنی ۴۰×۴۰",
      slug: "steel-profile-40x40-mashhad",
      description: "درخواست خرید ۲ تن پروفیل آهنی ۴۰×۴۰، تحویل مشهد.",
      category: findCat("metals"),
      quantity: 2,
      unit: "تن",
      province: "خراسان رضوی",
      city: "مشهد",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      bids: [{ seller: sellers[2]._id, price: 332500000, note: "" }]
    }
  ];

  for (const r of rfqsData) {
    const rfq = await Rfq.create({
      title: r.title,
      slug: r.slug,
      description: r.description,
      category: r.category,
      buyer: buyer._id,
      quantity: r.quantity,
      unit: r.unit,
      province: r.province,
      city: r.city,
      status: "active",
      expiresAt: r.expiresAt
    });

    for (const b of r.bids) {
      await Bid.create({ rfq: rfq._id, seller: b.seller, price: b.price, note: b.note });
    }
  }
  console.log(`${rfqsData.length} درخواست خرید با پیشنهادهای اولیه ایجاد شد.`);

  console.log("\n✅ Seed کامل شد. اطلاعات ورود آزمایشی:");
  console.log("  خریدار:  buyer@tamin.ir  /  password123");
  console.log("  فروشنده: seller1@tamin.ir  /  password123");
  console.log("  ادمین:   admin@tamin.ir  /  password123");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
