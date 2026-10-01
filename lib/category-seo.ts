/**
 * Single rule for "does this category page have enough real content to be
 * indexed?" — used by the page's robots meta AND the sitemap so they can
 * never disagree.
 *
 *  - a branch (has subcategories) is a real hub page → indexable
 *  - a leaf is indexable while it has ≥1 open auction, OR when an admin
 *    has written real editorial content for it
 */
export const CATEGORY_MIN_DESCRIPTION_CHARS = 150;
export const CATEGORY_MIN_CONTENT_CHARS = 300;

export function hasCategoryEditorialContent(c: {
  description?: string | null;
  seoContent?: string | null;
}): boolean {
  return (
    (c.description ?? "").trim().length >= CATEGORY_MIN_DESCRIPTION_CHARS ||
    (c.seoContent ?? "").trim().length >= CATEGORY_MIN_CONTENT_CHARS
  );
}

export function isCategoryIndexable(c: {
  isParent: boolean;
  openRfqCount: number;
  hasContent: boolean;
}): boolean {
  return c.isParent || c.openRfqCount > 0 || c.hasContent;
}

/** Parses the admin's FAQ textarea: blocks separated by a blank line; first line = question, rest = answer. */
export function parseFaqText(text: string): { q: string; a: string }[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split("\n");
      return { q: first.trim(), a: rest.join("\n").trim() };
    })
    .filter((f) => f.q && f.a)
    .slice(0, 12);
}

export function faqToText(faq: { q: string; a: string }[] | undefined | null): string {
  return (faq ?? []).map((f) => `${f.q}\n${f.a}`).join("\n\n");
}

// ---- SEO completeness (used by the admin AI-SEO tool) ---------------------

export const SEO_FIELDS = ["seoTitle", "seoDescription", "description", "seoContent", "faq"] as const;
export type SeoField = (typeof SEO_FIELDS)[number];

export const SEO_FIELD_LABELS: Record<SeoField, string> = {
  seoTitle: "عنوان سئو",
  seoDescription: "توضیح متا",
  description: "توضیح دسته",
  seoContent: "محتوای سئو",
  faq: "سوالات متداول"
};

/** Which of the five SEO fields are still empty. */
export function getMissingSeoFields(s: {
  seoTitle?: string | null;
  seoDescription?: string | null;
  description?: string | null;
  seoContent?: string | null;
  faqCount: number;
}): SeoField[] {
  const missing: SeoField[] = [];
  if (!(s.seoTitle ?? "").trim()) missing.push("seoTitle");
  if (!(s.seoDescription ?? "").trim()) missing.push("seoDescription");
  if (!(s.description ?? "").trim()) missing.push("description");
  if (!(s.seoContent ?? "").trim()) missing.push("seoContent");
  if (s.faqCount === 0) missing.push("faq");
  return missing;
}

/** complete = all five filled · none = all five empty · partial = anything in between. */
export function getSeoStatus(missing: SeoField[]): "complete" | "partial" | "none" {
  if (missing.length === 0) return "complete";
  if (missing.length === SEO_FIELDS.length) return "none";
  return "partial";
}
