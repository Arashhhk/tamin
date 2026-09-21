import Link from "next/link";
import { Bell, Mail, Search, Gavel, PlusCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getParentCategories } from "@/lib/queries";
import SellerTermsModal from "./SellerTermsModal";
import LogoutButton from "./LogoutButton";
import { logoutAction } from "@/app/(auth)/actions";

const roleLabels: Record<string, string> = { buyer: "خریدار", seller: "فروشنده", admin: "ادمین" };

const mainNav = [
  { href: "/", label: "خانه" },
  { href: "/rfq", label: "مزایده‌های فعال" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/sellers", label: "فروشندگان برتر" },
  { href: "/how-it-works", label: "چطور کار می‌کند" }
];

export default async function Header() {
  const [user, categories] = await Promise.all([getCurrentUser(), getParentCategories()]);
  const needsSellerTerms = Boolean(user && user.role === "seller" && !user.sellerTermsAcceptedAt);

  // Header CTA changes by role:
  //  - guest (not logged in, could become either): "ثبت درخواست خرید یا فروش"
  //  - buyer: "ثبت درخواست خرید" → /rfq/new (creates a buy request)
  //  - seller: "ثبت درخواست فروش" → /seller (this marketplace is
  //    reverse-auction: only buyers post requests, sellers bid on them
  //    — there's no separate "create a sell listing" page, so a
  //    seller's version of this button sends them to their dashboard,
  //    the closest real action, rather than to the buyer-only /rfq/new
  //    which middleware would just redirect them away from anyway.
  const ctaHref = user?.role === "seller" ? "/seller" : "/rfq/new";
  const ctaLabel = !user
    ? "ثبت درخواست خرید یا فروش"
    : user.role === "seller"
      ? "ثبت درخواست فروش"
      : "ثبت درخواست خرید";

  return (
    <>
      {needsSellerTerms && <SellerTermsModal />}
      <header className="sticky top-0 z-40 border-b border-line bg-sand/95 backdrop-blur">
      {/* Row 1: brand, search, primary actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-ink-900"
          aria-label="پله - صفحه اصلی"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-500 text-white shadow-pop">
            <Gavel className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">پله</span>
        </Link>

        <div className="min-w-0 flex-1">
          <label htmlFor="site-search" className="sr-only">
            جستجو در درخواست‌ها، مزایده‌ها و محصولات
          </label>
          <div className="flex items-center rounded-lg border border-line bg-white focus-within:border-camel-400">
            <input
              id="site-search"
              type="search"
              placeholder="جستجو در درخواست‌ها، مزایده‌ها و محصولات..."
              className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <button
              type="button"
              aria-label="جستجو"
              className="shrink-0 px-3 py-2.5 text-ink-600 hover:text-camel-500"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <Link
          href={ctaHref}
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-camel-500 px-4 py-2.5 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600 md:flex"
        >
          <PlusCircle className="h-4 w-4" />
          {ctaLabel}
        </Link>

        <nav className="flex shrink-0 items-center gap-1.5">
          {user ? (
            <>
              <button
                type="button"
                aria-label="اعلان‌ها"
                className="relative hidden rounded-full p-2 text-ink-600 hover:bg-camel-50 hover:text-camel-600 sm:flex"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="پیام‌ها"
                className="relative hidden rounded-full p-2 text-ink-600 hover:bg-camel-50 hover:text-camel-600 sm:flex"
              >
                <Mail className="h-5 w-5" />
              </button>

              <Link
                href={user.role === "seller" ? "/seller" : user.role === "admin" ? "/admin" : "/profile"}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 hover:bg-camel-50"
              >
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-bold leading-tight text-ink-900">
                    {user.name}
                  </span>
                  <span className="block text-xs leading-tight text-ink-400">
                    {roleLabels[user.role]}
                  </span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-camel-100 text-sm font-bold text-camel-700">
                  {user.name.slice(0, 1)}
                </span>
              </Link>

              <form action={logoutAction}>
                <LogoutButton />
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-bold text-ink-700 hover:bg-camel-50"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-camel-500 px-3 py-2 text-sm font-bold text-white hover:bg-camel-600"
              >
                ثبت‌نام
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Row 2: primary nav + category quick links */}
      <div className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2 sm:px-6">
          <nav className="flex shrink-0 items-center gap-5">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-xs font-bold text-ink-600 transition hover:text-camel-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="h-4 w-px shrink-0 bg-line" aria-hidden />
          <div className="flex shrink-0 items-center gap-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="whitespace-nowrap text-xs text-ink-400 transition hover:text-camel-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="border-t border-line bg-white px-4 py-2 md:hidden">
        <Link
          href={ctaHref}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-camel-500 py-2.5 text-sm font-bold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          {ctaLabel}
        </Link>
      </div>
    </header>
    </>
  );
}
