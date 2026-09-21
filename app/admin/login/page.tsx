import type { Metadata } from "next";
import { Gavel, ShieldAlert } from "lucide-react";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "ورود ادمین",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-ink-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Gavel className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold">پنل ادمین پله</span>
        </div>

        <div className="rounded-xl2 bg-white p-6 shadow-2xl">
          <h1 className="mb-1 flex items-center justify-center gap-2 text-center text-base font-extrabold text-ink-900">
            <ShieldAlert className="h-4 w-4 text-danger" />
            ورود مدیریت
          </h1>
          <p className="mb-5 text-center text-xs text-ink-500">
            این بخش با نام کاربری و رمز عبور جداگانه‌ی مدیریت محافظت می‌شود —
            ربطی به حساب‌های کاربری عادی سایت ندارد.
          </p>
          <AdminLoginForm next={searchParams.next || "/admin"} />
        </div>
      </div>
    </main>
  );
}
