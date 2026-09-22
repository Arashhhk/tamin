import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, ShieldQuestion, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BidForm from "@/components/BidForm";
import DeliveryConfirmPanel from "@/components/DeliveryConfirmPanel";
import RfqChat from "@/components/RfqChat";
import RatingForm from "@/components/RatingForm";
import BidsList from "./BidsList";
import { getRfqBySlug, getBidsForViewer, getDeliveryConfirmation, getRatingForRfq } from "@/lib/queries";
import { getCurrentUser } from "@/lib/current-user";
import { checkOverdueDeliveryForRfq } from "@/lib/violations";
import { absoluteUrl } from "@/lib/site";
import { formatNumber, formatToman, timeRemaining } from "@/lib/format";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const rfq = await getRfqBySlug(params.slug);
  if (!rfq) return { title: "درخواست یافت نشد" };

  const locationLabel = rfq.city ? `${rfq.city}، ${rfq.province}` : rfq.province;
  const title = `${rfq.title} | درخواست خرید در ${rfq.city || rfq.province}`;
  const description = `${rfq.description} — ${formatNumber(rfq.bidsCount)} پیشنهاد فروشنده تاکنون ثبت شده. مکان تحویل: ${locationLabel}.`;

  return {
    title,
    description,
    alternates: { canonical: `/rfq/${rfq.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/rfq/${rfq.slug}`),
      type: "website"
    },
    robots:
      rfq.status === "active"
        ? { index: true, follow: true }
        : { index: false, follow: true } // delisted RFQs stay crawlable via links but out of the index
  };
}

export default async function RfqDetailPage({ params }: { params: { slug: string } }) {
  const rfq = await getRfqBySlug(params.slug);
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
    "@type": "Product",
    name: rfq.title,
    description: rfq.description,
    category: rfq.categorySlug,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice: rfq.lowestBid,
      offerCount: rfq.bidsCount,
      availability: "https://schema.org/InStock",
      areaServed: rfq.city ? `${rfq.city}, ${rfq.province}` : rfq.province
    }
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
          <Link href={`/categories/${rfq.categorySlug}`} className="hover:text-camel-600">
            {rfq.categorySlug}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-600">{rfq.title}</span>
        </nav>

        <article className="rounded-xl2 border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
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
              <RfqChat rfqId={rfq.id} />
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
      </main>
      <Footer />
    </>
  );
}
