import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import * as Icons from "lucide-react";
import { ChevronLeft, Layers, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getCategoryBySlug, getCategoryRedirectSlug, getActiveRfqs } from "@/lib/queries";
import { absoluteUrl, site } from "@/lib/site";
import { connectToDatabase } from "@/lib/mongodb";
import Rfq from "@/models/Rfq";
import { openRfqFilter } from "@/lib/rfq-status";
import CategoryContent from "@/components/CategoryContent";
import { isCategoryIndexable } from "@/lib/category-seo";
import { formatNumber } from "@/lib/format";

// generateMetadata and the page both need the category: de-dupe within one
// request instead of hitting MongoDB twice (request-scoped, never stale).
const getCategoryCached = cache(getCategoryBySlug);

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cat = await getCategoryCached(params.slug);
  if (!cat) return { title: "دسته‌بندی یافت نشد" };
  // Dynamic, data-driven copy (different for every category — no shared
  // template sentence with only the name swapped).
  const childNames = cat.isParent ? cat.children.slice(0, 4).map((c) => c.name) : [];
  const autoTitle = cat.isParent
    ? `دسته‌بندی ${cat.name} و زیردسته‌ها`
    : `درخواست خرید و مزایده ${cat.name}`;
  const autoDescription = cat.isParent
    ? childNames.length > 0
      ? `زیردسته‌های ${cat.name} در پله: ${childNames.join("، ")}${cat.children.length > childNames.length ? " و ..." : ""}. یک زیردسته را انتخاب کنید و درخواست‌های خرید فعال آن را ببینید.`
      : `دسته ${cat.name} روی پله؛ زیردسته‌ها و درخواست‌های خرید این حوزه پس از ثبت اینجا نمایش داده می‌شود.`
    : cat.openRfqCount > 0
      ? `${cat.openRfqCount.toLocaleString("fa-IR")} درخواست خرید فعال برای ${cat.name} روی پله. فروشندگان روی هر مزایده قیمت پیشنهاد می‌دهند و خریدار بهترین پیشنهاد را انتخاب می‌کند.`
      : `درخواست خرید و مزایده ${cat.name} روی پله. در حال حاضر مزایده‌ی بازی در این دسته نیست؛ می‌توانید درخواست خرید خود را ثبت کنید.`;
  // A leaf category with no open auction is a near-empty page (same shell as
  // every other empty leaf) → noindex,follow until it has real content.
  // The province filter is NOT noindexed: canonical → the unfiltered URL is
  // the single, non-conflicting signal for it.
  const thinLeaf = !isCategoryIndexable({
    isParent: cat.isParent,
    openRfqCount: cat.openRfqCount,
    hasContent: cat.hasContent
  });
  // Admin-written SEO title/description win over the auto-built ones.
  const title = cat.seoTitle || autoTitle;
  const description = cat.seoDescription || cat.description.slice(0, 160) || autoDescription;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${cat.slug}` },
    robots: thinLeaf ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      url: absoluteUrl(`/categories/${cat.slug}`),
      title: `${title} | ${site.name}`,
      description
    },
    twitter: { card: "summary", title: `${title} | ${site.name}`, description }
  };
}

// Live MongoDB data (category tree, active RFQs in this category),
// not inherited from the root layout anymore — see app/page.tsx's
// full comment on this same line for why an explicit per-page flag is
// needed to avoid a build-time DB connection attempt. This route also
// has no generateStaticParams, so Next.js wouldn't try to prerender
// any specific slug at build time regardless — this flag is
// deliberate defense-in-depth on top of that, not the only thing
// preventing it.
export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { province?: string };
}) {
  const cat = await getCategoryCached(params.slug);
  if (!cat) {
    // A renamed category's old URL → permanent (308) redirect to the new one.
    const to = await getCategoryRedirectSlug(params.slug);
    if (to) permanentRedirect(`/categories/${to}`);
    notFound();
  }

  const Breadcrumb = () => (
    <nav aria-label="مسیر صفحه" className="mb-3 text-xs text-ink-400">
      <Link href="/" className="hover:text-camel-600">
        پله
      </Link>
      <span className="mx-1.5">/</span>
      <Link href="/categories" className="hover:text-camel-600">
        دسته‌بندی‌ها
      </Link>
      {cat.ancestors.map((a) => (
        <span key={a.slug}>
          <span className="mx-1.5">/</span>
          <Link href={`/categories/${a.slug}`} className="hover:text-camel-600">
            {a.name}
          </Link>
        </span>
      ))}
      <span className="mx-1.5">/</span>
      <span className="text-ink-600">{cat.name}</span>
    </nav>
  );

  const HeaderIcon = (Icons as any)[cat.icon] ?? Icons.Package;

  // Real, accurate breadcrumb trail — home, categories index, every
  // real ancestor, then this category — safe to mark up as
  // BreadcrumbList since it's exactly what's rendered visibly above.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "پله", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "دسته‌بندی‌ها", item: absoluteUrl("/categories") },
      ...cat.ancestors.map((a, i) => ({
        "@type": "ListItem",
        position: i + 3,
        name: a.name,
        item: absoluteUrl(`/categories/${a.slug}`)
      })),
      {
        "@type": "ListItem",
        position: cat.ancestors.length + 3,
        name: cat.name,
        item: absoluteUrl(`/categories/${cat.slug}`)
      }
    ]
  };

  // Branch: only show the subcategory list — no RFQs, no province
  // filter, since neither is meaningful until the visitor drills down
  // to an actual leaf category.
  if (cat.isParent) {
    // Auctions posted directly on this category BEFORE it gained
    // subcategories would otherwise become unreachable (leaf pages are
    // the only place RFQ cards show), so surface them here too.
    const directRfqs = await getActiveRfqs({ categorySlug: cat.slug, directOnly: true, limit: 200 });
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
          <Breadcrumb />
          <h1 className="mb-2 flex items-center gap-2 text-xl font-extrabold text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
              <HeaderIcon className="h-4.5 w-4.5" />
            </span>
            {cat.name}
          </h1>
          <p className="mb-6 text-sm text-ink-500">
            {formatNumber(cat.children.length)} زیردسته — یکی را انتخاب کنید تا درخواست‌های خرید مربوط را ببینید
          </p>
          {cat.description && (
            <p className="mb-6 max-w-3xl text-sm leading-7 text-ink-600">{cat.description}</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.children.map((child) => {
              const ChildIcon = (Icons as any)[child.icon] ?? Icons.Package;
              return (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="group flex items-center gap-4 rounded-xl2 border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-camel-300"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-camel-50 text-camel-600">
                    <ChildIcon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-extrabold text-ink-900">
                      {child.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                      {child.isBranch ? (
                        <>
                          <Layers className="h-3.5 w-3.5" />
                          {formatNumber(child.count)} زیردسته
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" />
                          {formatNumber(child.count)} درخواست فعال
                        </>
                      )}
                    </span>
                  </span>
                  <ChevronLeft className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:text-camel-500" />
                </Link>
              );
            })}
            {cat.children.length === 0 && (
              <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
                این دسته هنوز زیردسته‌ای ندارد.
              </p>
            )}
          </div>

          {directRfqs.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-base font-extrabold text-ink-900">
                مزایده‌های فعال در همین دسته ({formatNumber(directRfqs.length)})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {directRfqs.map((rfq) => (
                  <RfqCard key={rfq.id} rfq={rfq as any} />
                ))}
              </div>
            </section>
          )}

          <CategoryContent content={cat.seoContent} faq={cat.faq} />
        </main>
        <Footer />
      </>
    );
  }

  // Leaf: show the actual RFQ cards + province filter.
  await connectToDatabase();
  const provinces: string[] = await Rfq.find({
    ...openRfqFilter(),
    category: cat.id
  }).distinct("province");

  const filtered = await getActiveRfqs({
    categorySlug: cat.slug,
    province: searchParams.province,
    limit: 200
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <Breadcrumb />
        <h1 className="mb-2 flex items-center gap-2 text-xl font-extrabold text-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
            <HeaderIcon className="h-4.5 w-4.5" />
          </span>
          {cat.name}
        </h1>
        {/* Short, factual, non-templated-looking sentence for topic
            relevance (Google understanding what this page is about) —
            not a fabricated product description, just what's actually
            true of every leaf category page: buyers post requests
            here, sellers bid, it's a reverse auction ("مزایده"). */}
        <p className="mb-1 max-w-2xl text-sm leading-7 text-ink-500">
          {cat.description ||
            `درخواست‌های خرید مرتبط با «${cat.name}» در این صفحه قرار می‌گیرند. هر درخواست یک مزایده‌ی معکوس است: خریدار نیاز خود را ثبت می‌کند و فروشندگان روی آن قیمت پیشنهاد می‌دهند.`}
        </p>
        <p className="mb-6 text-sm text-ink-500">
          {formatNumber(filtered.length)} درخواست خرید فعال در این دسته
        </p>

        {provinces.length > 0 && (
          // Plain <a> tags here used to force a full browser reload on
          // every province click instead of a Next.js client
          // transition — which also meant app/loading.tsx (the
          // centered spinner) never got a chance to show, since that
          // spinner is Next's own transition UI, not something that
          // runs during a raw page reload. `Link` restores both the
          // fast client-side navigation and the spinner feedback.
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={`/categories/${cat.slug}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${!searchParams.province ? "border-camel-500 bg-camel-500 text-white" : "border-line text-ink-600 hover:border-camel-300"}`}
            >
              همه استان‌ها
            </Link>
            {provinces.map((p) => (
              <Link
                key={p}
                href={`/categories/${cat.slug}?province=${encodeURIComponent(p)}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${searchParams.province === p ? "border-camel-500 bg-camel-500 text-white" : "border-line text-ink-600 hover:border-camel-300"}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        {/*
          Business rule preserved here: RfqCard never renders buyer or
          seller identity (see components/RfqCard.tsx) — only title,
          quantity, city, lowest bid, bid count, and time remaining.
          Clicking a card goes to the RFQ detail page, which also never
          shows the buyer's name and keeps sellers anonymous until the
          buyer selects one — same hidden-identity rule, just one level
          deeper for anyone who wants the full description before
          bidding.
        */}
        <h2 className="sr-only">مزایده‌های فعال {cat.name}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq as any} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              {searchParams.province
                ? "در این استان مزایده فعالی وجود ندارد."
                : "مزایده فعالی در این دسته وجود ندارد."}
            </p>
          )}
        </div>

        <CategoryContent content={cat.seoContent} faq={cat.faq} />

        {/* Internal links: leaf → its parent + sibling categories, so leaf
            pages aren't dead ends and are reachable from each other. */}
        {(cat.ancestors.length > 0 || cat.siblings.length > 0) && (
          <nav aria-label="دسته‌های مرتبط" className="mt-10 border-t border-line pt-6">
            <h2 className="mb-3 text-sm font-extrabold text-ink-900">دسته‌های مرتبط</h2>
            <ul className="flex flex-wrap gap-2">
              {cat.ancestors.length > 0 && (
                <li>
                  <Link
                    href={`/categories/${cat.ancestors[cat.ancestors.length - 1].slug}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-600 hover:border-camel-300"
                  >
                    همه‌ی {cat.ancestors[cat.ancestors.length - 1].name}
                  </Link>
                </li>
              )}
              {cat.siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/categories/${s.slug}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-600 hover:border-camel-300"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
      <Footer />
    </>
  );
}
