import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Rfq } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const statusStyles: Record<string, string> = {
  active: "bg-camel-50 text-camel-700",
  selecting: "bg-success/10 text-success",
  in_progress: "bg-success/10 text-success",
  completed: "bg-ink-50 text-ink-500",
  expired: "bg-danger/10 text-danger"
};

const statusLabels: Record<string, string> = {
  active: "در حال مزایده",
  selecting: "در حال انتخاب",
  in_progress: "در حال انجام",
  completed: "پایان یافته",
  expired: "منقضی شده"
};

export default function RecentRfqsTable({ rfqs }: { rfqs: Rfq[] }) {
  return (
    <section aria-labelledby="recent-rfqs-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="recent-rfqs-heading" className="text-base font-extrabold text-ink-900">
          درخواست‌های خرید اخیر
        </h2>
        <Link href="/rfq" className="text-sm font-bold text-camel-600 hover:text-camel-700">
          مشاهده همه
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl2 border border-line bg-white shadow-card">
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-400">
              <th className="px-4 py-3 font-bold">عنوان درخواست</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">تاریخ ثبت</th>
              <th className="px-4 py-3 font-bold">منطقه</th>
              <th className="px-4 py-3 font-bold">تعداد / مقدار</th>
              <th className="px-4 py-3 font-bold">دسته‌بندی</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="border-b border-line last:border-0 hover:bg-camel-50/40">
                <td className="px-4 py-3 font-bold text-ink-900">
                  <Link href={`/rfq/${rfq.slug}`} className="hover:text-camel-600">
                    {rfq.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[rfq.status]}`}
                  >
                    {statusLabels[rfq.status]}
                  </span>
                </td>
                <td className="num px-4 py-3 text-ink-600">
                  {new Date(rfq.createdAt).toLocaleDateString("fa-IR")}
                </td>
                <td className="px-4 py-3 text-ink-600">{rfq.province}</td>
                <td className="num px-4 py-3 text-ink-600">
                  {formatNumber(rfq.quantity)} {rfq.unit}
                </td>
                <td className="px-4 py-3 text-ink-600">{rfq.categorySlug}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/rfq/${rfq.slug}`}
                    aria-label={`مشاهده جزئیات ${rfq.title}`}
                    className="text-ink-400 hover:text-camel-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
