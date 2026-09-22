// Core domain types — mirrored by the Mongoose schemas in /models.
// Kept here so components and API routes share one contract.

export type UserRole = "buyer" | "seller" | "admin";

export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  city?: string;
  province?: string;
  rating: number; // 0-5
  ratingCount: number;
  dealsCompleted: number;
  verified: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string; // lucide-react icon name
  parentSlug?: string;
  rfqCount: number;
}

export type RfqStatus = "active" | "selecting" | "in_progress" | "completed" | "expired" | "cancelled";

/**
 * What an Rfq's `buyer` field actually carries everywhere it's queried
 * (see toRfqCard/getRfqBySlug in lib/queries.ts, which only ever
 * `.populate("buyer", "name")`). Deliberately NOT the full `PublicUser`
 * shape — nothing in the app reads rating/verified/etc. off an RFQ's
 * buyer, only id + name (ownership checks, display name in tables).
 */
export interface RfqBuyerSummary {
  id: string;
  name: string;
}

export interface Rfq {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  buyer?: RfqBuyerSummary;
  quantity: number;
  unit: string;
  province: string;
  city?: string;
  status: RfqStatus;
  selectedAt?: string;
  bidsCount: number;
  lowestBid?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  images?: string[];
  /**
   * Business rule: while status is "active", seller identities on bids
   * are hidden from the buyer's public view of this RFQ. Only after the
   * buyer selects a bid (status -> "selecting" -> "in_progress") does the
   * winning seller's contact info become visible to the buyer, and the
   * RFQ is delisted from public/category listings.
   */
}

export type BidStatus = "pending" | "selected" | "rejected" | "withdrawn";

export interface Bid {
  id: string;
  rfqId: string;
  seller: PublicUser; // hidden from buyer UI until status === "selected"
  price: number;
  note?: string;
  status: BidStatus;
  createdAt: string;
}

export interface DeliveryConfirmation {
  rfqId: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  completedAt?: string;
}
