import { Schema, model, models, type Model, type Types } from "mongoose";

export type RfqStatus = "active" | "selecting" | "in_progress" | "completed" | "expired" | "cancelled";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why these use `Types.ObjectId`, not `Schema.Types.ObjectId`.
export interface IRfq {
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  buyer: Types.ObjectId;
  quantity: number;
  unit: string;
  province: string;
  city?: string;
  images: string[];
  status: RfqStatus;
  selectedBid?: Types.ObjectId | null;
  selectedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RfqSchema = new Schema<IRfq>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, maxlength: 4000 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    province: { type: String, required: true, index: true },
    // Optional — the buyer picks a required province and, only if
    // they want to narrow it further, a city within it (see
    // components/ProvinceCitySelect.tsx). Every read site that
    // displays this falls back to province-only when it's empty.
    city: { type: String, index: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "selecting", "in_progress", "completed", "expired", "cancelled"],
      default: "active",
      index: true
    },
    // Set once the buyer taps "انتخاب فروشنده" on a bid. From that point:
    //  - this RFQ is excluded from all public/category/search listings
    //    (enforced in queries via status !== 'active', see /app/rfq route)
    //  - the buyer's UI is allowed to read the winning seller's contact
    //    fields (see /app/api/rfq/[id]/select route)
    selectedBid: { type: Schema.Types.ObjectId, ref: "Bid", default: null },
    selectedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

// Public listing queries always filter status:'active' — indexed for it.
RfqSchema.index({ status: 1, category: 1, province: 1, createdAt: -1 });
RfqSchema.index({ title: "text", description: "text" });

export default (models.Rfq as Model<IRfq>) || model<IRfq>("Rfq", RfqSchema);
