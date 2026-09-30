import { isRfqOpen } from "./rfq-status";

/**
 * Two deliberately SEPARATE questions about an RFQ — never merge them:
 *
 *   1. isActiveForMarketplace(rfq) — BUSINESS visibility: may this RFQ appear
 *      in live listings (homepage, categories, /rfq, seller dashboard) and
 *      accept bids? Only while it is genuinely open.
 *
 *   2. isIndexableForSEO(rfq) — SEARCH visibility: should Google keep this URL
 *      in its index? A completed, content-rich RFQ can stay indexed as an
 *      archive page even though it is no longer in the marketplace.
 *
 * getRfqSeoState() derives everything SEO-related (robots, sitemap bucket,
 * archive flag) from those two, in one place.
 */

export interface RfqSeoInput {
  title: string;
  description: string;
  status: string;
  expiresAt: Date | string | null | undefined;
  selectedBid?: unknown;
  categorySlug?: string;
}

// Content-quality thresholds. Tune here; nothing else hardcodes them.
export const SEO_MIN_TITLE_CHARS = 8;
export const SEO_MIN_DESCRIPTION_CHARS_ACTIVE = 30;
export const SEO_MIN_DESCRIPTION_CHARS_ARCHIVE = 80;

export function isActiveForMarketplace(rfq: Pick<RfqSeoInput, "status" | "expiresAt">): boolean {
  return isRfqOpen(rfq.status, rfq.expiresAt);
}

/** Enough real, non-trivial text to be worth a search-result slot. */
function hasSufficientContent(rfq: RfqSeoInput, minDescription: number): boolean {
  const title = (rfq.title ?? "").trim();
  const description = (rfq.description ?? "").trim();
  if (title.length < SEO_MIN_TITLE_CHARS || description.length < minDescription) return false;
  // Junk like "aaaaaaaa" / "........": a single repeated character is not content.
  if (new Set(description.replace(/\s+/g, "")).size < 6) return false;
  if (description === title) return false;
  return true;
}

export type RfqSeoBucket = "active" | "archive" | null;

export interface RfqSeoState {
  /** Business rule: shown in live Marketplace listings / accepts bids. */
  marketplaceActive: boolean;
  /** Finished RFQ kept as a public reference page (not in any live list). */
  isArchive: boolean;
  /** Google may index this URL. */
  indexable: boolean;
  /** Which sitemap bucket it belongs to, if any. */
  sitemapBucket: RfqSeoBucket;
  robots: { index: boolean; follow: boolean };
}

export function isIndexableForSEO(rfq: RfqSeoInput): boolean {
  return getRfqSeoState(rfq).indexable;
}

export function getRfqSeoState(rfq: RfqSeoInput): RfqSeoState {
  const marketplaceActive = isActiveForMarketplace(rfq);

  if (marketplaceActive) {
    const ok = hasSufficientContent(rfq, SEO_MIN_DESCRIPTION_CHARS_ACTIVE);
    return {
      marketplaceActive: true,
      isArchive: false,
      indexable: ok,
      sitemapBucket: ok ? "active" : null,
      robots: { index: ok, follow: true }
    };
  }

  // Not active. Only a COMPLETED deal (a seller was chosen and delivery was
  // confirmed) with real content is worth keeping as an archive page.
  // expired / cancelled / in_progress / selecting → noindex,follow, no sitemap.
  const archiveWorthy =
    rfq.status === "completed" &&
    Boolean(rfq.selectedBid) &&
    hasSufficientContent(rfq, SEO_MIN_DESCRIPTION_CHARS_ARCHIVE);

  return {
    marketplaceActive: false,
    isArchive: archiveWorthy,
    indexable: archiveWorthy,
    sitemapBucket: archiveWorthy ? "archive" : null,
    robots: { index: archiveWorthy, follow: true }
  };
}
