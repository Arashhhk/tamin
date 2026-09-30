import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getActiveRfqs } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "مزایده‌های فعال | درخواست‌های خرید روی پله",
  description:
    "لیست کامل مزایده‌های خرید فعال روی پله؛ روی هر مزایده، فروشندگان مختلف قیمت پیشنهاد می‌دهند و خریدار بهترین گزینه را انتخاب می‌کند.",
  alternates: { canonical: "/rfq" }
};

// Live MongoDB data (active RFQs), not inherited from the root layout
// anymore — see app/page.tsx's full comment on this same line for why
// an explicit per-page flag is needed here to avoid a build-time DB
// connection attempt.
export const dynamic = "force-dynamic";

export default async function RfqListPage() {
  // getActiveRfqs already filters status:'active' at the query level —
  // once a buyer selects a bid the RFQ disappears from here automatically.
  const publicRfqs = await getActiveRfqs({ limit: 200 });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "پله", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "مزایده‌های فعال", item: absoluteUrl("/rfq") }
    ]
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <nav aria-label="مسیر صفحه" className="mb-4 text-xs text-ink-400">
          <Link href="/" className="hover:text-camel-600">
            پله
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-600">مزایده‌های فعال</span>
        </nav>
        <h1 className="mb-1 text-xl font-extrabold text-ink-900">
          مزایده‌های فعال ({publicRfqs.length})
        </h1>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-ink-500">
          هر کارت زیر یک مزایده‌ی معکوس است: یک خریدار درخواست خرید خود را ثبت کرده و منتظر
          پیشنهاد قیمت از فروشنده‌هاست. برای دیدن جزئیات و ثبت پیشنهاد روی هرکدام کلیک کنید.
        </p>
        <h2 className="sr-only">فهرست مزایده‌های فعال</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {publicRfqs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
          {publicRfqs.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              در حال حاضر مزایده فعالی وجود ندارد.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
