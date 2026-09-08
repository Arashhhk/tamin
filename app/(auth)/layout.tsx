import Link from "next/link";
import { Gavel } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-ink-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-camel-500 text-white shadow-pop">
            <Gavel className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold">تامین</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
