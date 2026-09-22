import Link from "next/link";
import { MapPin, Package, Clock } from "lucide-react";
import type { Rfq } from "@/lib/types";
import { formatToman, formatNumber, timeRemaining } from "@/lib/format";

const sellerBidStatusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "در انتظار بررسی", className: "bg-camel-50 text-camel-700" },
  selected: { text: "برنده شده", className: "bg-success/10 text-success" },
  rejected: { text: "رد شده", className: "bg-ink-100 text-ink-500" }
};

export default function RfqCard({
  rfq,
  sellerBid
}: {
  rfq: Rfq;
  /**
   * Only passed from the seller dashboard's "درخواست‌های باز" list.
   * `undefined` (default) means "not in a seller-bid-status context" —
   * card renders exactly as it always did (used on the homepage, the
   * public category pages, etc). `null` means the viewer IS a seller
   * but has no bid on this RFQ yet. An object means they do, and its
   * `status` drives the same wording used everywhere else in the app
   * (pending/selected/rejected).
   */
  sellerBid?: { price: number; status: string } | null;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl2 border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:border-camel-300">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
          <Clock className="h-3.5 w-3.5" />
          {timeRemaining(rfq.expiresAt)}
        </span>
      </div>

      <div className="flex flex-1 items-center gap-3 px-4 py-3">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-camel-50 text-camel-500"
        >
          <Package className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-ink-900">
            <Link href={`/rfq/${rfq.slug}`} className="hover:text-camel-600">
              {rfq.title}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-ink-400">
            تعداد: {formatNumber(rfq.quantity)} {rfq.unit}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
            <MapPin className="h-3 w-3" />
            مکان: {rfq.city ? `${rfq.city}، ${rfq.province}` : rfq.province}
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[11px] text-ink-400">بهترین پیشنهاد</p>
        <p className="num text-base font-extrabold text-camel-600">
          {rfq.lowestBid ? formatToman(rfq.lowestBid) : "هنوز پیشنهادی ثبت نشده"}
        </p>
      </div>

      {sellerBid !== undefined && (
        <div className="border-t border-line px-4 py-3">
          {sellerBid ? (
            <div className="flex items-center justify-between gap-2">
              <span className="num text-sm font-extrabold text-ink-900">
                پیشنهاد شما: {formatToman(sellerBid.price)}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  sellerBidStatusLabels[sellerBid.status]?.className ?? "bg-ink-100 text-ink-500"
                }`}
              >
                {sellerBidStatusLabels[sellerBid.status]?.text ?? sellerBid.status}
              </span>
            </div>
          ) : (
            <p className="text-xs font-bold text-ink-400">شما پیشنهادی ثبت نکرده‌اید</p>
          )}
        </div>
      )}

      <div className="flex border-t border-line">
        <Link
          href={`/rfq/${rfq.slug}`}
          className="flex-1 border-l border-line py-2.5 text-center text-xs font-bold text-ink-600 transition hover:bg-camel-50"
        >
          جزئیات ({formatNumber(rfq.bidsCount)} پیشنهاد)
        </Link>
        {!sellerBid && (
          <Link
            href={`/rfq/${rfq.slug}#bid`}
            className="flex-1 bg-camel-500 py-2.5 text-center text-xs font-bold text-white transition hover:bg-camel-600"
          >
            ثبت پیشنهاد
          </Link>
        )}
      </div>
    </article>
  );
}
