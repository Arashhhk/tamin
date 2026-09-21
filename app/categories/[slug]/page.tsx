import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { ChevronLeft, Layers, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getCategoryBySlug, getActiveRfqs } from "@/lib/queries";
import { connectToDatabase } from "@/lib/mongodb";
import Rfq from "@/models/Rfq";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: "دسته‌بندی یافت نشد" };
  return {
    title: `${cat.name} | درخواست‌های خرید و مزایده`,
    description: `درخواست‌های خرید فعال در دسته ${cat.name} روی پله. فروشندگان می‌توانند قیمت پیشنهاد دهند.`,
    alternates: { canonical: `/categories/${cat.slug}` }
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { province?: string };
}) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const Breadcrumb = () => (
    <nav aria-label="مسیر صفحه" className="mb-3 text-xs text-ink-400">
      <Link href="/categories" className="hover:text-camel-600">
        دسته‌بندی‌ها
      </Link>
      {cat.parent && (
        <>
          <span className="mx-1.5">/</span>
          <Link href={`/categories/${cat.parent.slug}`} className="hover:text-camel-600">
            {cat.parent.name}
          </Link>
        </>
      )}
      <span className="mx-1.5">/</span>
      <span className="text-ink-600">{cat.name}</span>
    </nav>
  );

  const HeaderIcon = (Icons as any)[cat.icon] ?? Icons.Package;

  // Branch: only show the subcategory list — no RFQs, no province
  // filter, since neither is meaningful until the visitor drills down
  // to an actual leaf category.
  if (cat.isParent) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
        </main>
        <Footer />
      </>
    );
  }

  // Leaf: show the actual RFQ cards + province filter.
  await connectToDatabase();
  const provinces: string[] = await Rfq.find({
    status: "active",
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
        <Breadcrumb />
        <h1 className="mb-2 flex items-center gap-2 text-xl font-extrabold text-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
            <HeaderIcon className="h-4.5 w-4.5" />
          </span>
          {cat.name}
        </h1>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq as any} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              در حال حاضر درخواست فعالی در این فیلتر وجود ندارد.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
