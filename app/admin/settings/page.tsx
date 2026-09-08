import type { Metadata } from "next";

export const metadata: Metadata = { title: "تنظیمات | ادمین", robots: { index: false } };

export default function AdminSettingsPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-extrabold text-ink-900">تنظیمات پلتفرم</h1>
      <section className="max-w-xl space-y-4 rounded-xl2 border border-line bg-white p-5 shadow-card">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">مدت پیش‌فرض مزایده (ساعت)</label>
          <input
            type="number"
            defaultValue={24}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-800">حداقل امتیاز فروشنده برای نمایش در «برترین‌ها»</label>
          <input
            type="number"
            step="0.1"
            defaultValue={4.5}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
        </div>
        <button className="rounded-lg bg-camel-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600">
          ذخیره تنظیمات
        </button>
      </section>
    </>
  );
}
