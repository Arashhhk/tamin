import { Schema, model, models, type Model, type Types } from "mongoose";

export type BidStatus = "pending" | "selected" | "rejected" | "withdrawn";

// See models/User.ts for why this deliberately does NOT `extends Document`.
//
// NOTE on ObjectId typing: `rfq`/`seller` here use `Types.ObjectId` (the
// real BSON id class), NOT `Schema.Types.ObjectId`. Those are two
// different things in Mongoose's type system — `Schema.Types.ObjectId`
// is the *SchemaType* class used when DEFINING a schema (see the
// `type: Schema.Types.ObjectId` lines below, which are correct as-is),
// while `Types.ObjectId` is the actual runtime id value type a document
// field holds. Using the SchemaType class as a field's TS type causes
// exactly the "missing auto/cast/defaultOptions/..." error this file
// was fixed for — those are SchemaType-only members.
export interface IBid {
  rfq: Types.ObjectId;
  seller: Types.ObjectId;
  price: number;
  note?: string;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    rfq: { type: Schema.Types.ObjectId, ref: "Rfq", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    note: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "selected", "rejected", "withdrawn"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

BidSchema.index({ rfq: 1, seller: 1 }, { unique: true });

/**
 * IMPORTANT — access control lives at the API layer, not just the schema:
 *
 * GET /api/rfq/:id/bids (buyer-facing, while rfq.status === 'active')
 *   -> project OUT `seller` entirely; buyer only sees { price, note, createdAt }.
 *
 * POST /api/rfq/:id/select { bidId }
 *   -> sets rfq.status = 'selecting' then 'in_progress', rfq.selectedBid = bidId,
 *      bid.status = 'selected', all sibling bids -> 'rejected'.
 *   -> only AFTER this does the buyer-facing bid/RFQ response populate `seller`
 *      (name, phone, company) so they can coordinate delivery.
 *   -> the RFQ is simultaneously removed from public listing queries.
 */
export default (models.Bid as Model<IBid>) || model<IBid>("Bid", BidSchema);
