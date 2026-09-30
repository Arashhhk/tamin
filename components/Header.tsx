import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getParentCategories } from "@/lib/queries";
import HeaderAuth from "./HeaderAuth";
import RoleAwareCTA from "./RoleAwareCTA";
import DealsNavLink from "./DealsNavLink";
import BrandLogo from "./BrandLogo";

const mainNav = [
  { href: "/", label: "خانه" },
  { href: "/rfq", label: "مزایده‌های فعال" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/sellers", label: "فروشندگان برتر" },
  { href: "/how-it-works", label: "چطور کار می‌کند" }
];

// Category names in the quick-links row are public, identical for
// every visitor, and change rarely — a perfect candidate for Next's
// data cache instead of a fresh Mongo round-trip on every single
// request. This, on its own, was never what forced this whole route
// tree dynamic (getCurrentUser() was — see HeaderAuth.tsx) — this
// cache is a separate, additive win once that's no longer blocking
// static generation.
const getCachedParentCategories = unstable_cache(getParentCategories, ["header-categories"], {
  revalidate: 3600,
  tags: ["categories"]
});

const ctaClassDesktop =
  "hidden shrink-0 items-center gap-1.5 rounded-lg bg-camel-500 px-4 py-2.5 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600 md:flex";
const ctaClassMobile =
  "flex items-center justify-center gap-1.5 rounded-lg bg-camel-500 py-2.5 text-sm font-bold text-white";

/**
 * No longer async, no longer touches cookies() (directly or via
 * getCurrentUser()) — everything that depends on who's logged in now
 * lives in HeaderAuth / RoleAwareCTA / DealsNavLink (all "use client",
 * fetching /api/me after mount). That split is the entire reason
 * app/layout.tsx's old `force-dynamic` could be removed: a Server
 * Component that only reads public data like getParentCategories()
 * doesn't force its route into per-request dynamic rendering the way
 * reading the session cookie did.
 */
export default async function Header() {
  // Header renders on every page, including ones now marked
  // `export const revalidate = ...` (e.g. app/about/page.tsx) instead
  // of force-dynamic — which means this call can run during `next
  // build`, seeding the cache. If the DB genuinely isn't reachable at
  // that moment for any reason, this falls back to an empty quick-
  // links row instead of failing the entire build; the next
  // revalidation picks up real data as soon as the DB is reachable at
  // runtime. Pages that stay force-dynamic (the actual marketplace
  // pages) never depend on this fallback in practice, since they
  // always run at request time, when the DB is expected to be up.
  const categories = await getCachedParentCategories().catch(() => []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sand/95 backdrop-blur">
      {/* Row 1: brand, search, primary actions */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-ink-900"
          aria-label="پله - صفحه اصلی"
        >
          <BrandLogo />
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

        <RoleAwareCTA
          className={ctaClassDesktop}
          icon={<PlusCircle className="h-4 w-4" />}
          iconPosition="before"
        />

        <nav className="flex shrink-0 items-center gap-1.5">
          <HeaderAuth />
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
            <DealsNavLink />
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
        <RoleAwareCTA
          className={ctaClassMobile}
          icon={<PlusCircle className="h-4 w-4" />}
          iconPosition="before"
        />
      </div>
    </header>
  );
}
