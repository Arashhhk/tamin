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
