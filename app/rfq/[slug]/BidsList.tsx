import { ShieldCheck, User as UserIcon } from "lucide-react";
import SelectBidButton from "@/components/SelectBidButton";
import { formatToman, timeAgo } from "@/lib/format";

interface BidRow {
  id: string;
  price: number;
  note?: string;
  status: string;
  createdAt: string;
  isOwnBid: boolean;
  seller?: { id: string; name: string; city?: string; province?: string };
}

export default function BidsList({
  bids,
  rfqId,
  canSelect
}: {
  bids: BidRow[];
  rfqId: string;
  canSelect: boolean;
}) {
  if (bids.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-line bg-white p-6 text-center text-xs text-ink-400">
        هنوز هیچ فروشنده‌ای روی این درخواست پیشنهاد نداده است.
      </div>
    );
  }

  return (
    <ul className="mb-4 space-y-2">
      {bids.map((bid) => (
        <li
          key={bid.id}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl2 border p-4 ${
            bid.status === "selected"
              ? "border-success/40 bg-success/5"
              : bid.status === "rejected"
                ? "border-line bg-ink-50 opacity-60"
                : "border-line bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-camel-50 text-camel-600">
              <UserIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="num flex items-center gap-1.5 text-sm font-extrabold text-camel-600">
                {formatToman(bid.price)}
                {bid.isOwnBid && (
                  <span className="rounded-full bg-camel-100 px-1.5 py-0.5 text-[10px] font-bold text-camel-700">
                    پیشنهاد شما
                  </span>
                )}
              </p>
              {bid.note && <p className="text-xs text-ink-500">{bid.note}</p>}
              <p className="text-[11px] text-ink-400">
                {bid.seller ? (
                  <span className="flex items-center gap-1 font-bold text-ink-700">
                    <ShieldCheck className="h-3 w-3 text-success" />
                    {bid.seller.name}
                    {bid.seller.city ? ` · ${bid.seller.city}` : ""}
                  </span>
                ) : (
                  "فروشنده (هویت پس از انتخاب نمایش داده می‌شود)"
                )}
                {" · "}
                {timeAgo(bid.createdAt)}
              </p>
            </div>
          </div>

          {bid.status === "selected" && (
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
              انتخاب‌شده
            </span>
          )}
          {bid.status === "rejected" && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-400">
              رد شده
            </span>
          )}
          {canSelect && bid.status === "pending" && (
            <SelectBidButton rfqId={rfqId} bidId={bid.id} />
          )}
        </li>
      ))}
    </ul>
  );
}
