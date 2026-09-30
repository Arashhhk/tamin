import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { MapPin, Clock, ShieldQuestion, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BidForm from "@/components/BidForm";
import DeliveryConfirmPanel from "@/components/DeliveryConfirmPanel";
import RfqChat from "@/components/RfqChat";
import RatingForm from "@/components/RatingForm";
import RfqCard from "@/components/RfqCard";
import BidsList from "./BidsList";
import {
  getRfqBySlug,
  getBidsForViewer,
  getDeliveryConfirmation,
  getRatingForRfq,
  getSimilarActiveRfqs
} from "@/lib/queries";
import { getRfqSeoState } from "@/lib/rfq-seo";
import { getCurrentUser } from "@/lib/current-user";
import { checkOverdueDeliveryForRfq } from "@/lib/violations";
import { isChatClosed, CHAT_AUTO_CLOSE_HOURS } from "@/lib/chat";
import { absoluteUrl, site } from "@/lib/site";
import { formatNumber, formatToman, timeRemaining } from "@/lib/format";

/**
 * This route renders dynamically: getCurrentUser() below reads the
 * session cookie for real, page-specific reasons (who owns the RFQ,
 * which bids reveal identity to whom, whether the seller already
 * bid). React's request-scoped cache() only de-duplicates the two
 * lookups (generateMetadata + the page) within ONE request — it never
 * outlives the request. An earlier version used unstable_cache with a
 * 30s window here, which made status/selectedBid stale right after a
 * buyer selected a seller or a seller bid, so the delivery panel and
 * chat didn't appear for up to 30 seconds. RFQ state is transactional;
 * it must never be served from a time-based cache.
 */
const getCachedRfqBySlug = cache(getRfqBySlug);

// Explicit and redundant with the getCurrentUser() call below (Next.js
// already renders this dynamically because of that), kept anyway so
// the route's actual rendering mode is stated plainly here rather than
// only implied by a function call deep in the component.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const rfq = await getCachedRfqBySlug(params.slug);
  if (!rfq) return { title: "درخواست یافت نشد" };

  const locationLabel = rfq.city ? `${rfq.city}، ${rfq.province}` : rfq.province;
  const title = `${rfq.title} | مزایده خرید در ${rfq.city || rfq.province}`;
  // Meta descriptions much past ~155-160 chars just get truncated by
  // Google mid-sentence, which reads worse than a short one that ends
  // cleanly — rfq.description is free-form buyer text with no length
  // cap, so it's clipped here with room left for the fixed suffix.
  const isOpen = getRfqSeoState(rfq).marketplaceActive;
  const rawDescription = rfq.description.length > 85 ? `${rfq.description.slice(0, 85).trim()}…` : rfq.description;
  const description = isOpen
    ? `${rawDescription} — ${formatNumber(rfq.bidsCount)} پیشنهاد فروشنده. مکان تحویل: ${locationLabel}.`
    : `${rawDescription} — این درخواست خرید به پایان رسیده است. مکان تحویل: ${locationLabel}.`;

  return {
    title,
    description,
    alternates: { canonical: `/rfq/${rfq.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/rfq/${rfq.slug}`),
      type: "website",
      locale: site.locale,
      siteName: site.name
    },
    twitter: { card: "summary", title, description },
    // Marketplace visibility and index eligibility are separate decisions
    // (lib/rfq-seo.ts): a completed, content-rich RFQ stays indexable as an
    // archive page; expired/cancelled/thin ones are noindex,follow.
    robots: getRfqSeoState(rfq).robots
  };
}

export default async function RfqDetailPage({ params }: { params: { slug: string } }) {
  const rfq = await getCachedRfqBySlug(params.slug);
  if (!rfq) notFound();

  const user = await getCurrentUser();
  const viewer = user ? { id: String(user._id), role: user.role } : null;

  const bids = await getBidsForViewer(rfq.id, rfq.buyer?.id ?? "", rfq.selectedBid, viewer);

  const isBuyerOwner = viewer?.role === "buyer" && viewer.id === rfq.buyer?.id;
  const canSelect = isBuyerOwner && rfq.status === "active";
  const myBid = viewer?.role === "seller" ? bids.find((b) => b.isOwnBid) : undefined;
  // Once a seller has a bid on this RFQ, the form is replaced by a
  // "you already bid" notice instead of staying open — resubmitting
  // used to silently overwrite their existing bid's price (the API
  // upserts on {rfq, seller}), which looked like "I can just bid again"
  // but was actually quietly replacing their first offer.
  const canBid = viewer?.role === "seller" && rfq.status === "active" && !myBid;

  const hasWinner = Boolean(rfq.selectedBid) && rfq.status !== "active";
  const isSellerWinner =
    hasWinner && viewer?.role === "seller" && bids.some((b) => b.isOwnBid && b.status === "selected");
  const showDeliveryPanel = hasWinner && (isBuyerOwner || isSellerWinner);

  const delivery = showDeliveryPanel ? await getDeliveryConfirmation(rfq.id) : null;
  const rating = rfq.status === "completed" && showDeliveryPanel ? await getRatingForRfq(rfq.id) : null;

  const locationLabel = rfq.city ? `${rfq.city}، ${rfq.province}` : rfq.province;

  const seo = getRfqSeoState(rfq);
  const isClosed = !seo.marketplaceActive;
  const closedNotice =
    rfq.status === "cancelled"
      ? "این درخواست خرید لغو شده است."
      : "این درخواست خرید به پایان رسیده است.";
  // Only genuinely open auctions are ever linked from here — never other finished ones.
  const similarActive = isClosed ? await getSimilarActiveRfqs(rfq.categorySlug, rfq.id, 4) : [];

  // Opportunistic check: if this RFQ is in_progress and the delivery
  // deadline has passed without the seller confirming, this records a
  // violation (see lib/violations.ts). Cheap single-doc check, runs on
  // page view rather than needing a cron job.
  if (rfq.status === "in_progress") {
    checkOverdueDeliveryForRfq(rfq.id).catch((err) =>
      console.error("checkOverdueDeliveryForRfq failed:", err)
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    // Real ancestor chain (see lib/queries.ts's getRfqBySlug ->
    // getCategoryChain), not a fabricated Product/Offer schema — this
    // RFQ is a buy-side request that sellers bid on, not a listing
    // with a real public "price" a shopper could act on, so a
    // Product/AggregateOffer schema here would tell Google something
    // that isn't true about the page's content. BreadcrumbList is the
    // one schema type that's unambiguously accurate for every RFQ page.
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "پله", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "دسته‌بندی‌ها", item: absoluteUrl("/categories") },
      ...(rfq.categoryPath ?? []).map((c, i) => ({
        "@type": "ListItem",
        position: i + 3,
        name: c.name,
        item: absoluteUrl(`/categories/${c.slug}`)
      })),
      {
        "@type": "ListItem",
        position: (rfq.categoryPath?.length ?? 0) + 3,
        name: rfq.title
      }
    ]
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <nav aria-label="مسیر صفحه" className="mb-4 text-xs text-ink-400">
          <Link href="/" className="hover:text-camel-600">
            پله
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/categories" className="hover:text-camel-600">
            دسته‌بندی‌ها
          </Link>
          {(rfq.categoryPath ?? []).map((c) => (
            <span key={c.slug}>
              <span className="mx-1.5">/</span>
              <Link href={`/categories/${c.slug}`} className="hover:text-camel-600">
                {c.name}
              </Link>
            </span>
          ))}
          <span className="mx-1.5">/</span>
          <span className="text-ink-600">{rfq.title}</span>
        </nav>

        <article className="rounded-xl2 border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-camel-100 px-2.5 py-1 text-xs font-bold text-camel-800">
              مزایده معکوس
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                isClosed ? "bg-ink-100 text-ink-500" : "bg-success/10 text-success"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {timeRemaining(rfq.expiresAt)}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-camel-50 px-2.5 py-1 text-xs font-bold text-camel-700">
              <MapPin className="h-3.5 w-3.5" />
              {locationLabel}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-ink-900">{rfq.title}</h1>
          <p className="mt-2 leading-7 text-ink-600">{rfq.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl2 bg-camel-50 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-500">مقدار درخواستی</dt>
              <dd className="num mt-1 font-bold text-ink-900">
                {formatNumber(rfq.quantity)} {rfq.unit}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">بهترین پیشنهاد</dt>
              <dd className="num mt-1 font-bold text-camel-600">
                {rfq.lowestBid ? formatToman(rfq.lowestBid) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">تعداد پیشنهادها</dt>
              <dd className="num mt-1 font-bold text-ink-900">{formatNumber(rfq.bidsCount)}</dd>
            </div>
          </dl>

          {isClosed && (
            <div
              role="status"
              className="mt-5 rounded-xl2 border border-line bg-ink-50 p-4 text-center text-sm font-bold text-ink-600"
            >
              {closedNotice}
              <p className="mt-1 text-xs font-normal text-ink-400">
                امکان ثبت پیشنهاد جدید روی این درخواست وجود ندارد.
              </p>
            </div>
          )}

          {rfq.status === "active" && (
            <div className="mt-5 flex items-start gap-2 rounded-xl2 border border-line bg-sand p-4 text-xs text-ink-500">
              <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-camel-500" />
              <p>
                تا زمانی که یک پیشنهاد را انتخاب نکرده‌اید، هویت و اطلاعات
                تماس فروشندگان برای شما نمایش داده نمی‌شود. پس از انتخاب،
                اطلاعات فروشنده منتخب در اختیار شما قرار می‌گیرد و این آگهی
                از فهرست عمومی حذف می‌شود.
              </p>
            </div>
          )}

          {showDeliveryPanel && (
            <div className="mt-6">
              <DeliveryConfirmPanel
                rfqId={rfq.id}
                buyerConfirmed={delivery?.buyerConfirmed ?? false}
                sellerConfirmed={delivery?.sellerConfirmed ?? false}
                completed={delivery?.completed ?? false}
                viewerRole={viewer!.role as "buyer" | "seller"}
              />
            </div>
          )}

          {showDeliveryPanel && (
            <div className="mt-6">
              <RfqChat rfqId={rfq.id} closed={isChatClosed(rfq)} />
              <p className="mt-2 text-[11px] leading-5 text-ink-400">
                این گفتگو به‌محض تکمیل معامله (تایید تحویل توسط هر دو طرف) بسته می‌شود؛ در غیر
                این صورت حداکثر تا {formatNumber(CHAT_AUTO_CLOSE_HOURS)} ساعت پس از انتخاب
                فروشنده، حتی اگر تحویل هنوز تایید نشده باشد، به‌طور خودکار بسته خواهد شد.
              </p>
            </div>
          )}

          {rfq.status === "completed" && showDeliveryPanel && (
            <div className="mt-6">
              {rating ? (
                <div className="rounded-xl2 border border-line bg-white p-4">
                  <h3 className="mb-2 text-sm font-extrabold text-ink-900">
                    {isBuyerOwner ? "امتیاز شما به فروشنده" : "امتیاز خریدار به شما"}
                  </h3>
                  <div className="mb-2 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-5 w-5 ${
                          rating.stars >= n ? "fill-camel-500 text-camel-500" : "text-ink-200"
                        }`}
                      />
                    ))}
                  </div>
                  {rating.comment && <p className="text-xs leading-6 text-ink-600">{rating.comment}</p>}
                </div>
              ) : isBuyerOwner ? (
                <RatingForm rfqId={rfq.id} />
              ) : (
                <p className="rounded-xl2 border border-dashed border-line bg-white p-4 text-center text-xs text-ink-400">
                  خریدار هنوز به این معامله امتیاز نداده است.
                </p>
              )}
            </div>
          )}

          <section id="bid" aria-labelledby="bids-heading" className="mt-8">
            <h2 id="bids-heading" className="mb-3 text-sm font-extrabold text-ink-900">
              پیشنهادهای دریافتی ({formatNumber(rfq.bidsCount)})
            </h2>

            <BidsList bids={bids} rfqId={rfq.id} canSelect={canSelect} />

            {canBid && <BidForm rfqId={rfq.id} />}

            {myBid && rfq.status === "active" && (
              <div className="rounded-xl2 border border-camel-200 bg-camel-50 p-4 text-center text-xs font-bold text-camel-700">
                شما قبلاً روی این درخواست پیشنهاد {formatToman(myBid.price)} ثبت کرده‌اید. هر
                فروشنده فقط می‌تواند یک پیشنهاد روی هر درخواست داشته باشد.
              </div>
            )}

            {!viewer && rfq.status === "active" && (
              <p className="rounded-xl2 border border-dashed border-line bg-white p-6 text-center text-xs text-ink-400">
                <Link href="/login" className="font-bold text-camel-600 hover:text-camel-700">
                  وارد شوید
                </Link>{" "}
                تا بتوانید پیشنهاد ثبت کنید یا این درخواست را مدیریت کنید.
              </p>
            )}
          </section>
        </article>

        {similarActive.length > 0 && (
          <section aria-labelledby="similar-heading" className="mt-8">
            <h2 id="similar-heading" className="mb-4 text-base font-extrabold text-ink-900">
              درخواست‌های خرید فعال مشابه
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {similarActive.map((r) => (
                <RfqCard key={r.id} rfq={r} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
