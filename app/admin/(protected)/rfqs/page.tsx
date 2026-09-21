import type { Metadata } from "next";
import Link from "next/link";
import { getAllRfqsForAdmin } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import AdminRfqRow from "./AdminRfqRow";

export const metadata: Metadata = { title: "درخواست‌های خرید | ادمین", robots: { index: false } };
const statusFilters = [
  { value: "", label: "همه" },
  { value: "active", label: "در حال مزایده" },
  { value: "in_progress", label: "در حال انجام" },
  { value: "completed", label: "پایان یافته" },
  { value: "expired", label: "منقضی شده" },
  { value: "cancelled", label: "لغو شده" }
];

export default async function AdminRfqsPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  const allRfqs = await getAllRfqsForAdmin();
  const rfqs = searchParams.status
    ? allRfqs.filter((r) => r.status === searchParams.status)
    : allRfqs;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">درخواست‌های خرید ({formatNumber(rfqs.length)})</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/rfqs?status=${f.value}` : "/admin/rfqs"}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              (searchParams.status || "") === f.value
                ? "border-camel-500 bg-camel-500 text-white"
                : "border-line text-ink-600 hover:border-camel-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <section className="overflow-x-auto rounded-xl2 border border-line bg-white shadow-card">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-400">
              <th className="px-4 py-3 font-bold">عنوان</th>
              <th className="px-4 py-3 font-bold">خریدار</th>
              <th className="px-4 py-3 font-bold">دسته‌بندی</th>
              <th className="px-4 py-3 font-bold">استان</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">پیشنهادها</th>
              <th className="px-4 py-3 font-bold">اقدام</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <AdminRfqRow key={r.id} rfq={r as any} />
            ))}
            {rfqs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-400">
                  درخواستی با این وضعیت یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
