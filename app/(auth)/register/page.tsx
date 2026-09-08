import type { Metadata } from "next";
import Link from "next/link";
import { registerAction } from "../actions";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false }
};

export default function RegisterPage() {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6 shadow-card">
      <h1 className="mb-5 text-center text-lg font-extrabold text-ink-900">ساخت حساب کاربری</h1>
      <form action={registerAction} className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-ink-800">نوع حساب</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-bold has-[:checked]:border-camel-500 has-[:checked]:bg-camel-50 has-[:checked]:text-camel-700">
              <input type="radio" name="role" value="buyer" defaultChecked className="sr-only" />
              خریدار
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-bold has-[:checked]:border-camel-500 has-[:checked]:bg-camel-50 has-[:checked]:text-camel-700">
              <input type="radio" name="role" value="seller" className="sr-only" />
              فروشنده
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-800">
            نام و نام خانوادگی
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-800">
            ایمیل
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink-800">
            رمز عبور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
          <p className="mt-1 text-xs text-ink-400">حداقل ۸ کاراکتر</p>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600"
        >
          ثبت‌نام
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-500">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="font-bold text-camel-600 hover:text-camel-700">
          وارد شوید
        </Link>
      </p>
    </div>
  );
}
