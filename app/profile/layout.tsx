import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheck, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

const tabs = [
  { href: "/profile", label: "نمای کلی" },
  { href: "/profile/rfqs", label: "درخواست‌های من" },
  { href: "/profile/bids", label: "پیشنهادهای من" },
  { href: "/profile/settings", label: "تنظیمات حساب" }
];

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-4 rounded-xl2 border border-line bg-white p-5 shadow-card">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-camel-100 text-xl font-extrabold text-camel-700">
            {user.name.slice(0, 1)}
          </span>
          <div>
            <h1 className="flex items-center gap-1.5 text-lg font-extrabold text-ink-900">
              {user.name}
              {user.verified && <ShieldCheck className="h-4 w-4 text-success" />}
            </h1>
            <p className="flex items-center gap-3 text-xs text-ink-500">
              <span className="flex items-center gap-1 font-bold text-gold">
                {user.rating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              </span>
              {user.role === "buyer" ? "خریدار" : "فروشنده"}
              {user.verified ? " تایید شده" : ""}
            </p>
          </div>
        </div>

        <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 border-b-2 border-transparent px-4 py-2.5 text-sm font-bold text-ink-500 hover:text-camel-600 aria-[current=page]:border-camel-500 aria-[current=page]:text-camel-600"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children}
      </main>
      <Footer />
    </>
  );
}
