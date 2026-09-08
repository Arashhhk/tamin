import Link from "next/link";
import { MapPin, Package, Clock } from "lucide-react";
import type { Rfq } from "@/lib/types";
import { formatToman, formatNumber, timeRemaining } from "@/lib/format";

export default function RfqCard({ rfq }: { rfq: Rfq }) {
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
            مکان: {rfq.city}
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[11px] text-ink-400">بهترین پیشنهاد</p>
        <p className="num text-base font-extrabold text-camel-600">
          {rfq.lowestBid ? formatToman(rfq.lowestBid) : "هنوز پیشنهادی ثبت نشده"}
        </p>
      </div>

      <div className="flex border-t border-line">
        <Link
          href={`/rfq/${rfq.slug}`}
          className="flex-1 border-l border-line py-2.5 text-center text-xs font-bold text-ink-600 transition hover:bg-camel-50"
        >
          جزئیات ({formatNumber(rfq.bidsCount)} پیشنهاد)
        </Link>
        <Link
          href={`/rfq/${rfq.slug}#bid`}
          className="flex-1 bg-camel-500 py-2.5 text-center text-xs font-bold text-white transition hover:bg-camel-600"
        >
          ثبت پیشنهاد
        </Link>
      </div>
    </article>
  );
}
