import { Schema, model, models, type Model } from "mongoose";

// Blog/guide article. Nothing is generated: an article exists only when an
// admin/editor (or a script) inserts a real one. `status: "published"` +
// a real `publishedAt` is what makes it public, indexable and sitemap-listed.
export interface IArticle {
  slug: string;
  title: string;
  description: string; // meta description / summary
  content: string; // paragraphs separated by a blank line; "## " starts a subheading
  author: string;
  status: "draft" | "published";
  publishedAt?: Date | null;
  categorySlug?: string; // optional link to a real category page
}

const ArticleSchema = new Schema<IArticle>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 170 },
    content: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    categorySlug: { type: String, trim: true }
  },
  { timestamps: true } // updatedAt → Article.dateModified / sitemap lastModified
);

export default (models.Article as Model<IArticle>) || model<IArticle>("Article", ArticleSchema);
