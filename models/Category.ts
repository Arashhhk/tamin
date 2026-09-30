import { Schema, model, models, type Model, type Types } from "mongoose";

// See models/User.ts for why this deliberately does NOT `extends Document`.
// See models/Bid.ts for why `parent` uses `Types.ObjectId`, not `Schema.Types.ObjectId`.
export interface ICategory {
  name: string;
  slug: string;
  icon: string;
  parent?: Types.ObjectId | null;
  order: number;
  // Optional editorial SEO content, managed from the admin panel. Nothing
  // is auto-generated: empty = the page simply has no extra content.
  oldSlugs?: string[]; // previous slugs → permanent redirect to the current one
  seoTitle?: string;
  seoDescription?: string;
  description?: string; // visible intro under the H1
  seoContent?: string; // visible supplementary text below the listing
  faq?: { q: string; a: string }[]; // shown on the page (and only then in FAQPage JSON-LD)
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: "Package" },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    oldSlugs: { type: [String], default: [], index: true },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 170 },
    description: { type: String, trim: true, maxlength: 1500 },
    seoContent: { type: String, trim: true, maxlength: 8000 },
    faq: { type: [{ _id: false, q: { type: String, trim: true }, a: { type: String, trim: true } }], default: [] }
  },
  { timestamps: true }
);

export default (models.Category as Model<ICategory>) || model<ICategory>("Category", CategorySchema);
