import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheck, Star } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "فروشندگان برتر",
  description: "لیست فروشندگان با بالاترین امتیاز و بیشترین معاملات موفق در تامین.",
  alternates: { canonical: "/sellers" }
};

export default async function SellersPage() {
  await connectToDatabase();
  const sellers = await User.find({ role: "seller" })
    .sort({ rating: -1, dealsCompleted: -1 })
    .lean();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">فروشندگان برتر</h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sellers.map((s: any) => (
            <li
              key={String(s._id)}
              className="flex items-center gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-camel-100 text-sm font-bold text-camel-700">
                {s.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold text-ink-900">
                  {s.name}
                  {s.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-success" />}
                </p>
                <p className="text-xs text-ink-400">
                  {s.city} · {formatNumber(s.dealsCompleted)} معامله موفق
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-gold">
                {s.rating.toFixed(1)}
                <Star className="h-4 w-4 fill-gold text-gold" />
              </span>
            </li>
          ))}
          {sellers.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              هنوز فروشنده‌ای ثبت‌نام نکرده است.
            </p>
          )}
        </ul>
      </main>
      <Footer />
    </>
  );
}
