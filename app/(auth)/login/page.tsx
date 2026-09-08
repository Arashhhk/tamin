import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "ورود",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6 shadow-card">
      <h1 className="mb-5 text-center text-lg font-extrabold text-ink-900">
        ورود به حساب کاربری
      </h1>
      <form action={loginAction} className="space-y-4">
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
            required
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600"
        >
          ورود
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-ink-500">
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="font-bold text-camel-600 hover:text-camel-700">
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
  );
}
