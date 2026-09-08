import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getBuyerRfqs } from "@/lib/queries";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "درخواست‌های من",
  robots: { index: false, follow: false }
};

const statusStyles: Record<string, string> = {
  active: "bg-camel-50 text-camel-700",
  in_progress: "bg-success/10 text-success",
  completed: "bg-ink-50 text-ink-500",
  expired: "bg-danger/10 text-danger",
  cancelled: "bg-danger/10 text-danger"
};

const statusLabels: Record<string, string> = {
  active: "در حال مزایده",
  in_progress: "در حال انجام",
  completed: "پایان یافته",
  expired: "منقضی شده",
  cancelled: "لغو شده"
};

export default async function ProfileRfqsPage() {
  const user = (await getCurrentUser())!;
  const rfqs = user.role === "buyer" ? await getBuyerRfqs(String(user._id)) : [];

  return (
    <section className="overflow-hidden rounded-xl2 border border-line bg-white shadow-card">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-400">
            <th className="px-4 py-3 font-bold">عنوان</th>
            <th className="px-4 py-3 font-bold">وضعیت</th>
            <th className="px-4 py-3 font-bold">تعداد پیشنهاد</th>
            <th className="px-4 py-3 font-bold">تاریخ ثبت</th>
          </tr>
        </thead>
        <tbody>
          {rfqs.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0 hover:bg-camel-50/40">
              <td className="px-4 py-3 font-bold text-ink-900">
                <Link href={`/rfq/${r.slug}`} className="hover:text-camel-600">
                  {r.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[r.status]}`}>
                  {statusLabels[r.status]}
                </span>
              </td>
              <td className="num px-4 py-3 text-ink-600">{formatNumber(r.bidsCount)}</td>
              <td className="num px-4 py-3 text-ink-600">
                {new Date(r.createdAt).toLocaleDateString("fa-IR")}
              </td>
            </tr>
          ))}
          {rfqs.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-400">
                هنوز درخواستی ثبت نکرده‌اید.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
