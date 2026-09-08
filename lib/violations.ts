import { connectToDatabase } from "./mongodb";
import User from "@/models/User";
import Bid from "@/models/Bid";
import Rfq from "@/models/Rfq";
import DeliveryConfirmation from "@/models/DeliveryConfirmation";
import SellerViolation from "@/models/SellerViolation";

/**
 * Seller trust & strike system.
 *
 * A bid priced under this fraction of the average of the OTHER pending
 * bids on the same RFQ is treated as suspicious (likely a bad-faith
 * lowball bid placed with no intent to honor it).
 */
export const SUSPICIOUS_PRICE_THRESHOLD = 0.7;

/** How long a winning seller has to confirm delivery before it counts as a violation. */
const DELIVERY_DEADLINE_DAYS = 5;

const STRIKE_VISIBILITY_PENALTY_DAYS = 7;
const STRIKE_TEMP_SUSPENSION_DAYS = 14;

/**
 * Records a violation and applies the corresponding consequence:
 *  - Strike 1: warning + temporary "reduced visibility" (excluded from
 *    top-sellers ranking for STRIKE_VISIBILITY_PENALTY_DAYS).
 *  - Strike 2: automatic temporary suspension for STRIKE_TEMP_SUSPENSION_DAYS.
 *  - Strike 3+: NEVER auto-banned. Flags the account for manual admin
 *    review in the violations queue; only an admin can convert this into
 *    a permanent ban.
 */
export async function applyStrike(params: {
  sellerId: string;
  type: "suspicious_price" | "no_delivery";
  reason: string;
  rfqId?: string;
  bidId?: string;
}) {
  await connectToDatabase();
  const seller = await User.findById(params.sellerId);
  if (!seller || seller.role !== "seller") return;

  seller.strikeCount = (seller.strikeCount ?? 0) + 1;
  const strikeNumber = seller.strikeCount;

  const now = new Date();
  if (strikeNumber === 1) {
    seller.visibilityPenalizedUntil = new Date(now.getTime() + STRIKE_VISIBILITY_PENALTY_DAYS * 86400000);
  } else if (strikeNumber === 2) {
    seller.tempSuspendedUntil = new Date(now.getTime() + STRIKE_TEMP_SUSPENSION_DAYS * 86400000);
  } else {
    seller.banReviewPending = true;
  }
  await seller.save();

  await SellerViolation.create({
    seller: seller._id,
    rfq: params.rfqId || null,
    bid: params.bidId || null,
    type: params.type,
    reason: params.reason,
    resultingStrikeNumber: strikeNumber,
    status: strikeNumber >= 3 ? "pending_review" : "auto_applied"
  });
}

/**
 * Checks a freshly submitted bid against the average of the other
 * pending bids on the same RFQ. If it's suspiciously low, applies a
 * strike immediately (this is an objective, rule-based check — no
 * review needed for strikes 1–2; strike 3+ still routes to review).
 */
export async function checkSuspiciousBid(rfqId: string, sellerId: string, price: number) {
  await connectToDatabase();
  const otherBids = await Bid.find({ rfq: rfqId, seller: { $ne: sellerId }, status: "pending" }).lean();
  if (otherBids.length === 0) return; // nothing to compare against yet

  const avg = otherBids.reduce((sum, b: any) => sum + b.price, 0) / otherBids.length;
  if (avg <= 0) return;

  if (price < avg * SUSPICIOUS_PRICE_THRESHOLD) {
    await applyStrike({
      sellerId,
      type: "suspicious_price",
      reason: `قیمت پیشنهادی (${price.toLocaleString("en-US")} تومان) کمتر از ${Math.round(SUSPICIOUS_PRICE_THRESHOLD * 100)}٪ میانگین سایر پیشنهادها (${Math.round(avg).toLocaleString("en-US")} تومان) بود.`,
      rfqId
    });
  }
}

/**
 * Checks a single RFQ (called opportunistically when its detail page is
 * viewed) for an overdue, unconfirmed delivery by the winning seller.
 * Guards against double-flagging the same RFQ.
 */
export async function checkOverdueDeliveryForRfq(rfqId: string) {
  await connectToDatabase();
  const rfq = await Rfq.findById(rfqId).lean();
  if (!rfq || rfq.status !== "in_progress" || !rfq.selectedBid || !rfq.selectedAt) return;

  const deadline = new Date(rfq.selectedAt).getTime() + DELIVERY_DEADLINE_DAYS * 86400000;
  if (Date.now() < deadline) return;

  const delivery = await DeliveryConfirmation.findOne({ rfq: rfqId }).lean();
  if (delivery && delivery.sellerConfirmed) return; // seller did confirm, no violation

  const alreadyFlagged = await SellerViolation.findOne({ rfq: rfqId, type: "no_delivery" }).lean();
  if (alreadyFlagged) return;

  const bid = await Bid.findById(rfq.selectedBid).lean();
  if (!bid) return;

  await applyStrike({
    sellerId: String(bid.seller),
    type: "no_delivery",
    reason: `فروشنده ظرف ${DELIVERY_DEADLINE_DAYS} روز پس از انتخاب، تحویل کالا برای درخواست «${rfq.title}» را تایید نکرد.`,
    rfqId: String(rfq._id),
    bidId: String(bid._id)
  });
}

/** Effective account status accounting for an active temporary suspension. */
export function isEffectivelySuspended(user: { status: string; tempSuspendedUntil?: Date | null }) {
  if (user.status === "suspended") return true;
  if (user.tempSuspendedUntil && new Date(user.tempSuspendedUntil) > new Date()) return true;
  return false;
}

/**
 * Bulk sweep across every in_progress RFQ — run opportunistically when
 * the admin dashboard loads, so overdue deliveries get flagged even if
 * nobody happens to open that specific RFQ's page.
 */
export async function sweepOverdueDeliveries() {
  await connectToDatabase();
  const candidates = await Rfq.find({ status: "in_progress", selectedBid: { $ne: null } })
    .select("_id")
    .lean();
  await Promise.all(candidates.map((r: any) => checkOverdueDeliveryForRfq(String(r._id))));
}
