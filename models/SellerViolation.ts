import { Schema, model, models, type Model, type Types } from "mongoose";

export type ViolationType = "suspicious_price" | "no_delivery" | "buyer_report";
export type ViolationStatus = "auto_applied" | "pending_review" | "reviewed_banned" | "reviewed_dismissed";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why these use `Types.ObjectId`, not `Schema.Types.ObjectId`
// — this is exactly the field (`reviewedBy`) the "missing auto/cast/..."
// build error was reported on: `admin._id` correctly resolves to the real
// `mongoose.Types.ObjectId`, but this field was typed with the SchemaType
// class instead, so TypeScript rejected the assignment.
export interface ISellerViolation {
  seller: Types.ObjectId;
  rfq?: Types.ObjectId | null;
  bid?: Types.ObjectId | null;
  type: ViolationType;
  reason: string;
  resultingStrikeNumber?: number | null;
  status: ViolationStatus;
  reportedBy?: Types.ObjectId | null; // for buyer_report
  reviewedBy?: Types.ObjectId | null; // admin who resolved a pending_review
  reviewedAt?: Date | null;
  createdAt: Date;
}

const SellerViolationSchema = new Schema<ISellerViolation>(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rfq: { type: Schema.Types.ObjectId, ref: "Rfq", default: null },
    bid: { type: Schema.Types.ObjectId, ref: "Bid", default: null },
    type: { type: String, enum: ["suspicious_price", "no_delivery", "buyer_report"], required: true },
    reason: { type: String, required: true, maxlength: 500 },
    resultingStrikeNumber: { type: Number, default: null },
    status: {
      type: String,
      enum: ["auto_applied", "pending_review", "reviewed_banned", "reviewed_dismissed"],
      default: "auto_applied",
      index: true
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (models.SellerViolation as Model<ISellerViolation>) ||
  model<ISellerViolation>("SellerViolation", SellerViolationSchema);
