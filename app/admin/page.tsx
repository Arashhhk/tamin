import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Gavel, Users, CheckCircle2, PlusCircle, Layers } from "lucide-react";
import {
  getPlatformStats,
  getRfqStatusBreakdown,
  getUserRoleBreakdown,
  getTopCategoriesByRfqCount,
  getRfqsPerDay
} from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import TrendBarChart from "@/components/TrendBarChart";

export const metadata: Metadata = {
  title: "داشبورد ادمین",
  robots: { index: false, follow: false }
};

export default async function AdminDashboardPage() {
  const [platformStats, statusBreakdown, roleBreakdown, topCategories, dailyTrend] =
    await Promise.all([
      getPlatformStats(),
      getRfqStatusBreakdown(),
      getUserRoleBreakdown(),
      getTopCategoriesByRfqCount(6),
      getRfqsPerDay(14)
    ]);

  const cards = [
    { icon: FileText, label: "کل درخواست‌های خرید", value: platformStats.totalRfqs },
    { icon: Gavel, label: "مزایده‌های فعال", value: platformStats.activeRfqs },
    { icon: Users, label: "تعداد فروشندگان", value: platformStats.totalSellers },
    { icon: CheckCircle2, label: "معاملات موفق", value: platformStats.successfulDeals }
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-ink-900">داشبورد</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/categories"
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink-600 hover:border-camel-300 hover:text-camel-600"
          >
            <Layers className="h-3.5 w-3.5" />
            مدیریت دسته‌بندی‌ها
          </Link>
          <Link
            href="/admin/rfqs"
            className="flex items-center gap-1.5 rounded-lg bg-camel-500 px-3 py-2 text-xs font-bold text-white hover:bg-camel-600"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            مدیریت درخواست‌ها
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-line bg-white p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="num mt-3 text-2xl font-extrabold text-ink-900">
              {formatNumber(c.value)}
            </p>
            <p className="text-xs text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl2 border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-extrabold text-ink-900">
          روند ثبت درخواست خرید (۱۴ روز اخیر)
        </h2>
        <TrendBarChart data={dailyTrend} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl2 border border-line bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-extrabold text-ink-900">وضعیت درخواست‌ها</h2>
          <HorizontalBarChart
            data={statusBreakdown.map((s) => ({ label: s.label, count: s.count }))}
          />
        </div>

        <div className="rounded-xl2 border border-line bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-extrabold text-ink-900">دسته‌بندی‌های پرتقاضا</h2>
          <HorizontalBarChart
            data={topCategories.map((c) => ({ label: c.name, count: c.rfqCount }))}
            colorClass="bg-success"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-extrabold text-ink-900">توزیع کاربران</h2>
          <HorizontalBarChart
            data={roleBreakdown.map((r) => ({ label: r.label, count: r.count }))}
            colorClass="bg-gold"
          />
        </div>
      </div>
    </>
  );
}
