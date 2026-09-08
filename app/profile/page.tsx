import type { Metadata } from "next";
import { FileText, Gavel, CheckCircle2, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getBuyerRfqs, getSellerBidHistory } from "@/lib/queries";
import { connectToDatabase } from "@/lib/mongodb";
import Bid from "@/models/Bid";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "پروفایل من",
  robots: { index: false, follow: false }
};

export default async function ProfileOverviewPage() {
  const user = (await getCurrentUser())!;
  await connectToDatabase();

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
