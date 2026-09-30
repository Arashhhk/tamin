import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { formatNumber } from "@/lib/format";
import { computeTrustScore } from "@/lib/trust-score";

export async function generateMetadata({
  searchParams
}: {
  searchParams: { page?: string };
}): Promise<Metadata> {
  const page = Math.max(1, Math.floor(Number(searchParams.page)) || 1);
  return {
    title: page > 1 ? `خریداران برتر - صفحه ${page}` : "خریداران برتر",
    description: "لیست خریداران با بیشترین تعداد خرید موفق در پله.",
    // Every page canonicalizes to ITSELF (never page 2+ → page 1, which
    // would hide the people listed on later pages). "?page=1" is just a
    // duplicate of the base URL, so it canonicalizes there.
    alternates: { canonical: page > 1 ? `/buyers?page=${page}` : "/buyers" },
    // Deep pages are thin ranking lists: kept out of the index but still
    // crawlable so the links on them are followed.
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true }
  };
}

// Live MongoDB data (buyer rankings), not inherited from the root
// layout anymore — see app/page.tsx's full comment on this same line
// for why an explicit per-page flag is needed here to avoid a
// build-time DB connection attempt.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function BuyersPage({
  searchParams
}: {
  searchParams: { page?: string };
}) {
  await connectToDatabase();

  const page = Math.max(1, Math.floor(Number(searchParams.page)) || 1);
  // Buyers aren't rated by anyone yet, so ranking is purely by
  // completed-purchase volume — see lib/queries.ts's getTopBuyers for
  // the same logic used on the homepage. Paired with the
  // {role,status,dealsCompleted,rating} index added in models/User.ts.
  const filter = { role: "buyer", status: "active" };

  const [buyers, total] = await Promise.all([
    User.find(filter)
      // Only the fields this page actually renders (plus ratingCount,
      // which computeTrustScore needs even though it isn't displayed
      // directly) — never the full document with its email/phone/etc.
      .select("name city verified rating ratingCount dealsCompleted")
      .sort({ dealsCompleted: -1, rating: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Out-of-range ?page=N is an empty page → real 404, not a soft-404.
  if (page > totalPages) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">
          خریداران برتر ({formatNumber(total)})
        </h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {buyers.map((b: any) => (
            <li
              key={String(b._id)}
              className="flex items-center gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-camel-100 text-sm font-bold text-camel-700">
                {b.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold text-ink-900">
                  {b.name}
                  {b.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-success" />}
                </p>
                <p className="text-xs text-ink-400">
                  {b.city} · {formatNumber(b.dealsCompleted)} خرید موفق
                </p>
              </div>
              <span className="text-sm font-bold text-camel-600">
                امتیاز اعتبار: {computeTrustScore(b)}
              </span>
            </li>
          ))}
          {buyers.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              هنوز خریداری ثبت‌نام نکرده است.
            </p>
          )}
        </ul>

        {totalPages > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-8 flex items-center justify-center gap-2">
            <Link
              href={page > 1 ? `/buyers?page=${page - 1}` : "/buyers"}
              aria-disabled={page <= 1}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:border-camel-300 hover:text-camel-600"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <span className="num text-xs font-bold text-ink-500">
              صفحه {formatNumber(page)} از {formatNumber(totalPages)}
            </span>
            <Link
              href={`/buyers?page=${Math.min(totalPages, page + 1)}`}
              aria-disabled={page >= totalPages}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-line ${
                page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-camel-300 hover:text-camel-600"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </main>
      <Footer />
    </>
  );
}
