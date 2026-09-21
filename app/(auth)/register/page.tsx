import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "./RegisterForm";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false }
};

export default function RegisterPage() {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6 shadow-card">
      <h1 className="mb-5 text-center text-lg font-extrabold text-ink-900">ساخت حساب کاربری</h1>

      <GoogleAuthButton label="ثبت‌نام با گوگل" />

      <div className="my-4 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-line" />
        یا با ایمیل
        <span className="h-px flex-1 bg-line" />
      </div>

      <RegisterForm />

      <p className="mt-4 text-center text-xs text-ink-500">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="font-bold text-camel-600 hover:text-camel-700">
          وارد شوید
        </Link>
      </p>
    </div>
  );
}
