import Link from "next/link";
import { Gavel } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-camel-100 text-camel-600">
        <Gavel className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-extrabold text-ink-900">صفحه پیدا نشد</h1>
      <p className="max-w-sm text-sm text-ink-500">
        صفحه‌ای که دنبال آن بودید یا حذف شده یا هرگز وجود نداشته است.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-camel-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600"
      >
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
