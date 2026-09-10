import type { Metadata } from "next";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getActiveRfqs, getSellerViolationHistory } from "@/lib/queries";
import { getCurrentUser } from "@/lib/current-user";
import { connectToDatabase } from "@/lib/mongodb";
import Bid from "@/models/Bid";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "داشبورد فروشنده",
  robots: { index: false, follow: false }
};

const violationTypeLabels: Record<string, string> = {
  suspicious_price: "قیمت مشکوک",
  no_delivery: "عدم تحویل به‌موقع",
  buyer_report: "گزارش خریدار"
};

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="rounded-xl2 border border-line bg-white p-8 text-sm text-ink-500">
            دسترسی به این صفحه نیاز به ورود دارد، یا حساب شما موقتاً غیرفعال
            است. لطفاً دوباره وارد شوید.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const openRfqs = await getActiveRfqs({ limit: 100 });

  let activeBids = 0;
  let wonBids = 0;
  let pendingDelivery = 0;
  let violations: Awaited<ReturnType<typeof getSellerViolationHistory>> = [];

  if (user) {
    await connectToDatabase();
    activeBids = await Bid.countDocuments({ seller: user._id, status: "pending" });
    wonBids = await Bid.countDocuments({ seller: user._id, status: "selected" });
    pendingDelivery = wonBids; // simplification: all selected bids awaiting/at delivery stage
    violations = await getSellerViolationHistory(String(user._id));
  }

  const stats = [
    { label: "پیشنهادهای فعال", value: activeBids },
    { label: "برنده شده", value: wonBids },
    { label: "در انتظار تحویل", value: pendingDelivery },
    { label: "امتیاز شما", value: user ? Number(user.rating).toFixed(1) : "—" }
  ];

  const strikeCount = user?.strikeCount ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-xl font-extrabold text-ink-900">داشبورد فروشنده</h1>
        <p className="mb-6 text-sm text-ink-500">
          درخواست‌های خرید باز که می‌توانید روی آن‌ها قیمت پیشنهاد دهید.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl2 border border-line bg-white p-4 text-center shadow-card">
              <p className="num text-lg font-extrabold text-camel-600">
                {typeof s.value === "number" ? formatNumber(s.value) : s.value}
              </p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Trust status — kept visible so the strike system feels
            transparent rather than punitive-and-hidden. */}
        <div
          className={`mb-8 rounded-xl2 border p-4 ${
            strikeCount > 0 ? "border-gold/40 bg-gold/5" : "border-success/30 bg-success/5"
          }`}
        >
          <div className="flex items-center gap-2">
            {strikeCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-gold" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-success" />
            )}
            <h2 className="text-sm font-extrabold text-ink-900">
              وضعیت اعتبار حساب: {strikeCount} اخطار
            </h2>
          </div>
          {violations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {violations.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-start gap-2 text-xs text-ink-600">
                  <span className="mt-0.5 shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink-500 shadow-sm">
                    {violationTypeLabels[v.type] ?? v.type}
                  </span>
                  <span>{v.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-500">
              حساب شما تاکنون هیچ اخطاری نداشته است. همین‌طور ادامه دهید.
            </p>
          )}
        </div>

        <h2 className="mb-3 text-base font-extrabold text-ink-900">درخواست‌های باز</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {openRfqs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
          {openRfqs.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              در حال حاضر درخواست باز فعالی وجود ندارد.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
