import { Schema, model, models, type Model, type Types } from "mongoose";

export type SuggestionStatus = "new" | "read";

// See models/User.ts for why this deliberately does NOT `extends Document`.
export interface ISuggestion {
  name: string;
  email?: string | null;
  user?: Types.ObjectId | null; // set automatically if the submitter was logged in
  role?: "buyer" | "seller" | "admin" | "guest";
  message: string;
  status: SuggestionStatus;
  createdAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, default: null },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, enum: ["buyer", "seller", "admin", "guest"], default: "guest" },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read"], default: "new", index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (models.Suggestion as Model<ISuggestion>) ||
  model<ISuggestion>("Suggestion", SuggestionSchema);
