import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "مجله پله",
  description: "مقالات و راهنماهای خرید، تأمین کالا و مدیریت مزایده.",
  alternates: { canonical: "/blog" }
};

export default function BlogIndexPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-2xl font-extrabold text-ink-900">مجله پله</h1>
        <p className="mb-8 text-sm text-ink-500">
          به‌زودی مقالات راهنمای خرید و تأمین کالا اینجا منتشر می‌شود.
        </p>
        <div className="rounded-xl2 border border-dashed border-line bg-white p-10 text-center text-sm text-ink-400">
          این بخش برای محتوای سئو-محور (راهنمای خرید صنعتی، مقایسه
          تامین‌کنندگان، اخبار بازار) در نظر گرفته شده و به‌زودی تکمیل
          می‌شود.
        </div>
      </main>
      <Footer />
    </>
  );
}
