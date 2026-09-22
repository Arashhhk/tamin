import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, CheckCircle2, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/current-user";
import { getMyDeals } from "@/lib/queries";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "معاملات",
  robots: { index: false, follow: false }
};

const statusLabel: Record<string, { text: string; className: string }> = {
  in_progress: { text: "در حال انجام", className: "bg-camel-50 text-camel-700" },
  completed: { text: "تکمیل شده", className: "bg-success/10 text-success" }
};

export default async function DealsPage() {
  const user = await getCurrentUser();

  if (!user || user.role === "admin") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="rounded-xl2 border border-line bg-white p-8 text-sm text-ink-500">
            دسترسی به این صفحه نیاز به ورود با حساب خریدار یا فروشنده دارد.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const deals = await getMyDeals(String(user._id), user.role);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-xl font-extrabold text-ink-900">معاملات</h1>
        <p className="mb-6 text-sm text-ink-500">
          درخواست‌هایی که برنده‌شان مشخص شده — چه هنوز در حال هماهنگی تحویل، چه تکمیل‌شده.
        </p>

        <ul className="space-y-3">
          {deals.map((rfq) => (
            <li key={rfq.id}>
              <Link
                href={`/rfq/${rfq.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-camel-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-camel-50 text-camel-500">
                    <Handshake className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink-900">{rfq.title}</p>
                    <p className="text-xs text-ink-400">
                      {formatNumber(rfq.quantity)} {rfq.unit} · {rfq.city ? `${rfq.city}، ${rfq.province}` : rfq.province}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    statusLabel[rfq.status]?.className ?? "bg-ink-100 text-ink-500"
                  }`}
                >
                  {rfq.status === "completed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {statusLabel[rfq.status]?.text ?? rfq.status}
                </span>
              </Link>
            </li>
          ))}
          {deals.length === 0 && (
            <p className="rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              هنوز معامله‌ای برای شما ثبت نشده است.
            </p>
          )}
        </ul>
      </main>
      <Footer />
    </>
  );
}
