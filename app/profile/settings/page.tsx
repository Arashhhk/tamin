import type { Metadata } from "next";
import { logoutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "تنظیمات حساب",
  robots: { index: false, follow: false }
};

export default async function ProfileSettingsPage() {
  const user = (await getCurrentUser())!;

  return (
    <div className="space-y-6">
      <section className="rounded-xl2 border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-extrabold text-ink-900">اطلاعات حساب</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">نام و نام خانوادگی</label>
            <input
              defaultValue={user.name}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">ایمیل</label>
            <input
              defaultValue={user.email}
              disabled
              className="w-full rounded-lg border border-line bg-ink-50 px-3 py-2.5 text-sm text-ink-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">استان</label>
            <input
              defaultValue={user.province || ""}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-800">شهر</label>
            <input
              defaultValue={user.city || ""}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>
        </div>
        <button className="mt-4 rounded-lg bg-camel-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600">
          ذخیره تغییرات
        </button>
      </section>

      <section className="rounded-xl2 border border-danger/20 bg-white p-5 shadow-card">
        <h2 className="mb-1 text-sm font-extrabold text-ink-900">خروج از حساب</h2>
        <p className="mb-4 text-xs text-ink-500">با خروج، باید دوباره وارد حساب خود شوید.</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-danger/30 px-5 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/5"
          >
            خروج از حساب
          </button>
        </form>
      </section>
    </div>
  );
}
