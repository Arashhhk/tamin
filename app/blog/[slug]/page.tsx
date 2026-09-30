import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublishedArticleBySlug } from "@/lib/queries";
import { absoluteUrl, site } from "@/lib/site";

// Same live-DB / no-build-time-connection reasoning as the other data pages.
export const dynamic = "force-dynamic";

const getArticle = cache(getPublishedArticleBySlug);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return { title: "مقاله یافت نشد", robots: { index: false, follow: false } };
  const url = absoluteUrl(`/blog/${a.slug}`);
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title: a.title,
      description: a.description,
      locale: site.locale,
      siteName: site.name,
      publishedTime: a.publishedAt ?? undefined,
      modifiedTime: a.updatedAt ?? undefined,
      authors: [a.author]
    },
    twitter: { card: "summary", title: a.title, description: a.description }
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug);
  if (!a) notFound(); // draft / unpublished / unknown → real 404

  const blocks = a.content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    author: { "@type": "Person", name: a.author },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } },
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${a.slug}`)
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "مجله پله", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: a.title }
    ]
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fa-IR") : "");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <nav aria-label="مسیر صفحه" className="mb-4 text-xs text-ink-400">
          <Link href="/" className="hover:text-camel-600">خانه</Link> /{" "}
          <Link href="/blog" className="hover:text-camel-600">مجله پله</Link>
        </nav>
        <article>
          <h1 className="mb-2 text-2xl font-extrabold leading-snug text-ink-900">{a.title}</h1>
          <p className="mb-6 text-xs text-ink-400">
            {a.author} · منتشرشده در {fmt(a.publishedAt)}
            {a.updatedAt && a.updatedAt !== a.publishedAt ? ` · به‌روزرسانی ${fmt(a.updatedAt)}` : ""}
          </p>
          <div className="space-y-4 text-sm leading-8 text-ink-700">
            {blocks.map((b, i) =>
              b.startsWith("## ") ? (
                <h2 key={i} className="pt-3 text-lg font-extrabold text-ink-900">{b.slice(3)}</h2>
              ) : (
                <p key={i}>{b}</p>
              )
            )}
          </div>
        </article>
        {/* Internal links: article → category → active RFQs */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6 text-sm">
          {a.categorySlug && (
            <Link href={`/categories/${a.categorySlug}`} className="font-bold text-camel-600 hover:underline">
              مشاهده درخواست‌های خرید مرتبط
            </Link>
          )}
          <Link href="/rfq" className="font-bold text-camel-600 hover:underline">مزایده‌های فعال</Link>
          <Link href="/how-it-works" className="text-ink-500 hover:underline">پله چطور کار می‌کند؟</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
