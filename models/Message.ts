import { Schema, model, models, type Model, type Types } from "mongoose";

// See models/User.ts for why this deliberately does NOT `extends Document`.
export interface IMessage {
  rfq: Types.ObjectId;
  sender: Types.ObjectId;
  senderRole: "buyer" | "seller";
  body: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    // Not unique — many messages per RFQ, unlike Rating's one-per-deal.
    rfq: { type: Schema.Types.ObjectId, ref: "Rfq", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["buyer", "seller"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ rfq: 1, createdAt: 1 });

export default (models.Message as Model<IMessage>) || model<IMessage>("Message", MessageSchema);
