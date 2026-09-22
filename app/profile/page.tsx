import type { Metadata } from "next";
import { FileText, Gavel, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getBuyerRfqs, getSellerBidHistory } from "@/lib/queries";
import { connectToDatabase } from "@/lib/mongodb";
import Bid from "@/models/Bid";
import { formatNumber } from "@/lib/format";
import { computeTrustScore, trustScoreLabel } from "@/lib/trust-score";

export const metadata: Metadata = {
  title: "پروفایل من",
  robots: { index: false, follow: false }
};

export default async function ProfileOverviewPage() {
  const user = (await getCurrentUser())!;
  await connectToDatabase();

  const trustScore = computeTrustScore({
    rating: user.rating,
    ratingCount: user.ratingCount,
    dealsCompleted: user.dealsCompleted
  });

  const rfqs = user.role === "buyer" ? await getBuyerRfqs(String(user._id)) : [];
  const bidHistory = user.role === "seller" ? await getSellerBidHistory(String(user._id)) : [];

  const bidsReceived =
    user.role === "buyer" && rfqs.length > 0
      ? await Bid.countDocuments({ rfq: { $in: rfqs.map((r) => r.id) } })
      : 0;

  const cards =
    user.role === "buyer"
      ? [
          { icon: FileText, label: "کل درخواست‌ها", value: rfqs.length },
          { icon: Gavel, label: "پیشنهاد دریافتی", value: bidsReceived },
          { icon: CheckCircle2, label: "معامله موفق", value: rfqs.filter((r) => r.status === "completed").length },
          { icon: Clock, label: "در حال انجام", value: rfqs.filter((r) => r.status === "in_progress").length }
        ]
      : [
          { icon: Gavel, label: "کل پیشنهادها", value: bidHistory.length },
          { icon: CheckCircle2, label: "برنده شده", value: bidHistory.filter((b) => b.status === "selected").length },
          { icon: Clock, label: "در انتظار", value: bidHistory.filter((b) => b.status === "pending").length },
          { icon: FileText, label: "رد شده", value: bidHistory.filter((b) => b.status === "rejected").length }
        ];

  return (
    <div className="space-y-6">
      {/* Trust score: one automatic number for either role, combining
          received star rating (mainly meaningful for sellers today —
          see components/RatingForm.tsx) with completed-deal volume
          (both roles). See lib/trust-score.ts for the exact formula. */}
      <section className="flex items-center gap-4 rounded-xl2 border border-line bg-white p-5 shadow-card">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-camel-50 text-lg font-extrabold text-camel-600">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs text-ink-400">امتیاز اعتبار پروفایل شما</p>
          <p className="num text-2xl font-extrabold text-ink-900">
            {trustScore} <span className="text-sm font-bold text-camel-600">({trustScoreLabel(trustScore)})</span>
          </p>
          <p className="text-[11px] text-ink-400">
            {user.role === "buyer"
              ? `بر اساس ${formatNumber(user.dealsCompleted)} خرید تکمیل‌شده`
              : `بر اساس امتیاز ${user.rating.toFixed(1)} از ۵ (${formatNumber(user.ratingCount)} نظر) و ${formatNumber(user.dealsCompleted)} معامله موفق`}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-line bg-white p-4 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-camel-50 text-camel-600">
              <c.icon className="h-4 w-4" />
            </span>
            <p className="num mt-2 text-xl font-extrabold text-ink-900">{formatNumber(c.value)}</p>
            <p className="text-xs text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      {user.role === "buyer" && (
        <section className="rounded-xl2 border border-line bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-extrabold text-ink-900">آخرین درخواست‌های خرید</h2>
          <ul className="divide-y divide-line">
            {rfqs.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-bold text-ink-800">{r.title}</span>
                <span className="text-xs text-ink-400">
                  {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </li>
            ))}
            {rfqs.length === 0 && (
              <li className="py-3 text-sm text-ink-400">هنوز درخواستی ثبت نکرده‌اید.</li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
