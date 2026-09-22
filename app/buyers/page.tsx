import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { formatNumber } from "@/lib/format";
import { computeTrustScore } from "@/lib/trust-score";

export const metadata: Metadata = {
  title: "خریداران برتر",
  description: "لیست خریداران با بیشترین تعداد خرید موفق در پله.",
  alternates: { canonical: "/buyers" }
};

export default async function BuyersPage() {
  await connectToDatabase();
  // Buyers aren't rated by anyone yet, so ranking is purely by
  // completed-purchase volume — see lib/queries.ts's getTopBuyers for
  // the same logic used on the homepage.
  const buyers = await User.find({ role: "buyer", status: "active" })
    .sort({ dealsCompleted: -1, rating: -1 })
    .lean();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">خریداران برتر</h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {buyers.map((b: any) => (
            <li
              key={String(b._id)}
              className="flex items-center gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-camel-100 text-sm font-bold text-camel-700">
                {b.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold text-ink-900">
                  {b.name}
                  {b.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-success" />}
                </p>
                <p className="text-xs text-ink-400">
                  {b.city} · {formatNumber(b.dealsCompleted)} خرید موفق
                </p>
              </div>
              <span className="text-sm font-bold text-camel-600">
                امتیاز اعتبار: {computeTrustScore(b)}
              </span>
            </li>
          ))}
          {buyers.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              هنوز خریداری ثبت‌نام نکرده است.
            </p>
          )}
        </ul>
      </main>
      <Footer />
    </>
  );
}
