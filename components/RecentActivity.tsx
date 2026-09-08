import { Gavel, TrendingUp, PackagePlus, MessageSquare } from "lucide-react";

const items = [
  {
    icon: Gavel,
    title: "مزایده جدید برای ورق استیل ۳۰۴",
    time: "۲ دقیقه پیش"
  },
  {
    icon: TrendingUp,
    title: "پیشنهاد جدید روی کابل برق ۳×۶",
    time: "۵ دقیقه پیش"
  },
  {
    icon: PackagePlus,
    title: "درخواست خرید جدید: دستگاه جوش صنعتی",
    time: "۱۰ دقیقه پیش"
  },
  {
    icon: MessageSquare,
    title: "پیام جدید از فروشنده فولاد پارس",
    time: "۱۵ دقیقه پیش"
  }
];

export default function RecentActivity() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-camel-300"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-camel-50 text-camel-500">
            <item.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-ink-800">{item.title}</p>
            <p className="mt-1 text-xs text-ink-400">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
