import { Schema, model, models, type Model } from "mongoose";

/**
 * Deliberately does NOT `extends Document`. Mongoose's own `Document`
 * type has `_id: unknown` (for generic safety), and when a raw schema
 * interface inherits that, `.lean()`'s `FlattenMaps<T>` transform can't
 * resolve it — it leaves `_id` as an unresolved `FlattenMaps<unknown>`
 * instead of `Types.ObjectId`, which then fails to satisfy any other
 * schema's `Schema.Types.ObjectId` reference field (e.g.
 * SellerViolation.reviewedBy).
 *
 * Leaving `_id` out of this interface entirely and letting Mongoose's
 * own `Model<T>` / `HydratedDocument<T>` / lean-query typing add it is
 * the documented Mongoose 7+/8 pattern — it resolves correctly as
 * `Types.ObjectId` in both the hydrated (`.save()` etc. available) and
 * `.lean()` (plain object) cases, with no manual reconstruction needed.
 */
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: "buyer" | "seller" | "admin";
  phone?: string;
  avatarUrl?: string;
  province?: string;
  city?: string;
  companyName?: string;
  nationalId?: string; // برای احراز هویت فروشندگان
  verified: boolean;
  status: "active" | "suspended";
  rating: number;
  ratingCount: number;
  dealsCompleted: number;
  // Seller trust & strike system
  sellerTermsAcceptedAt?: Date | null;
  strikeCount: number;
  visibilityPenalizedUntil?: Date | null; // strike 1: deprioritized, e.g. excluded from "top sellers"
  tempSuspendedUntil?: Date | null; // strike 2: auto, reversible suspension
  banReviewPending: boolean; // strike 3+: awaiting manual admin decision, never auto-banned
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["buyer", "seller", "admin"], required: true, index: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    province: { type: String, index: true },
    city: { type: String, index: true },
    companyName: { type: String, trim: true },
    nationalId: { type: String, select: false },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    dealsCompleted: { type: Number, default: 0 },
    sellerTermsAcceptedAt: { type: Date, default: null },
    strikeCount: { type: Number, default: 0 },
    visibilityPenalizedUntil: { type: Date, default: null },
    tempSuspendedUntil: { type: Date, default: null },
    banReviewPending: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, province: 1 });

export default (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
