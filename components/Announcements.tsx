import { Megaphone, RefreshCw, Tag } from "lucide-react";

const announcements = [
  {
    icon: Megaphone,
    title: "تغییر در قوانین مزایده",
    time: "از تاریخ ۱۴۰۳/۰۳/۰۱"
  },
  {
    icon: RefreshCw,
    title: "به‌روزرسانی اپلیکیشن",
    time: "نسخه جدید منتشر شد"
  },
  {
    icon: Tag,
    title: "تخفیف کارمزد",
    time: "تا پایان خرداد ماه"
  }
];

export default function Announcements() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {announcements.map((a, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl2 border border-line bg-white p-5 shadow-card"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-camel-50 text-camel-500">
            <a.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-800">{a.title}</p>
            <p className="mt-1 text-xs text-ink-400">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
