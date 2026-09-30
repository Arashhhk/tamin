import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import Link from "next/link";
import { getPublishedArticles } from "@/lib/queries";

// The index is a placeholder (noindex) until at least one real article is
// published; then it becomes a normal indexable listing automatically.
export async function generateMetadata(): Promise<Metadata> {
  const articles = await getPublishedArticles(1);
  return {
    title: "مجله پله",
    description: "مقالات و راهنماهای خرید، تأمین کالا و مدیریت مزایده.",
    alternates: { canonical: "/blog" },
    robots: articles.length > 0 ? { index: true, follow: true } : { index: false, follow: false }
  };
}

// Live DB read (published articles) → per-request, like the other data pages.
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const articles = await getPublishedArticles(50);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-2xl font-extrabold text-ink-900">مجله پله</h1>
        {articles.length === 0 ? (
          <>
            <p className="mb-8 text-sm text-ink-500">
              به‌زودی مقالات راهنمای خرید و تأمین کالا اینجا منتشر می‌شود.
            </p>
            <div className="rounded-xl2 border border-dashed border-line bg-white p-10 text-center text-sm text-ink-400">
              این بخش برای محتوای سئو-محور (راهنمای خرید صنعتی، مقایسه
              تامین‌کنندگان، اخبار بازار) در نظر گرفته شده و به‌زودی تکمیل
              می‌شود.
            </div>
          </>
        ) : (
          <ul className="mt-6 space-y-4">
            {articles.map((a) => (
              <li key={a.slug} className="rounded-xl2 border border-line bg-white p-5 shadow-card">
                <h2 className="text-base font-extrabold text-ink-900">
                  <Link href={`/blog/${a.slug}`} className="hover:text-camel-600">{a.title}</Link>
                </h2>
                <p className="mt-1 text-sm leading-7 text-ink-500">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
