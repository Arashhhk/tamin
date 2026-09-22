import { Schema, model, models, type Model, type Types } from "mongoose";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why these use `Types.ObjectId`, not `Schema.Types.ObjectId`.
export interface IRating {
  rfq: Types.ObjectId;
  buyer: Types.ObjectId;
  seller: Types.ObjectId;
  stars: number;
  comment?: string;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    // Unique on rfq: exactly one rating per completed deal, so a buyer
    // can't rate the same deal twice and the average in User.rating
    // (see lib/ratings.ts) can only ever move once per deal.
    rfq: { type: Schema.Types.ObjectId, ref: "Rfq", required: true, unique: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (models.Rating as Model<IRating>) || model<IRating>("Rating", RatingSchema);
