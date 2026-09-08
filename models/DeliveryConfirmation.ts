import { Schema, model, models, type Model, type Types } from "mongoose";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why these use `Types.ObjectId`, not `Schema.Types.ObjectId`.
export interface IDeliveryConfirmation {
  rfq: Types.ObjectId;
  bid: Types.ObjectId;
  buyerConfirmed: boolean;
  buyerConfirmedAt?: Date;
  sellerConfirmed: boolean;
  sellerConfirmedAt?: Date;
  completedAt?: Date;
}

const DeliveryConfirmationSchema = new Schema<IDeliveryConfirmation>(
  {
    rfq: { type: Schema.Types.ObjectId, ref: "Rfq", required: true, unique: true, index: true },
    bid: { type: Schema.Types.ObjectId, ref: "Bid", required: true },
    buyerConfirmed: { type: Boolean, default: false },
    buyerConfirmedAt: { type: Date },
    sellerConfirmed: { type: Boolean, default: false },
    sellerConfirmedAt: { type: Date },
    // Set when both sides have confirmed — rfq.status moves to 'completed'.
    // No payment/settlement logic here yet (deferred per current scope);
    // this is only the two-sided delivery acknowledgement.
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default (models.DeliveryConfirmation as Model<IDeliveryConfirmation>) ||
  model<IDeliveryConfirmation>("DeliveryConfirmation", DeliveryConfirmationSchema);
