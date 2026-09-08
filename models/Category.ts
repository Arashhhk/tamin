import { Schema, model, models, type Model, type Types } from "mongoose";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why `parent` uses `Types.ObjectId`, not `Schema.Types.ObjectId`.
export interface ICategory {
  name: string;
  slug: string;
  icon: string;
  parent?: Types.ObjectId | null;
  order: number;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: "Package" },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default (models.Category as Model<ICategory>) || model<ICategory>("Category", CategorySchema);
