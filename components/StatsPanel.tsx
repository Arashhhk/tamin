import { FileText, Gavel, Users, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function StatsPanel({
  stats
}: {
  stats: { totalRfqs: number; activeRfqs: number; totalSellers: number; successfulDeals: number };
}) {
  const rows = [
    { icon: FileText, label: "درخواست‌های خرید", value: stats.totalRfqs },
    { icon: Gavel, label: "مزایده‌های فعال", value: stats.activeRfqs },
    { icon: Users, label: "تعداد فروشندگان", value: stats.totalSellers },
    { icon: CheckCircle2, label: "تراکنش‌های موفق", value: stats.successfulDeals }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col items-center gap-2 rounded-xl2 bg-white/10 p-5 text-center backdrop-blur-sm"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
            <row.icon className="h-5 w-5" />
          </span>
          <span className="num text-2xl font-extrabold text-white">{formatNumber(row.value)}</span>
          <span className="text-xs text-white/80">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
