import { revalidateTag } from "next/cache";

/** Cache tag shared by app/sitemap.ts's data fetch. */
export const SITEMAP_TAG = "sitemap";

/**
 * Call after anything that changes which URLs belong in the sitemap:
 * an RFQ is created, a seller is selected, delivery completes, an admin
 * cancels one, or category SEO content changes. Never throws — a failed
 * invalidation must not break the user's actual action (the sitemap
 * cache also self-expires in a few minutes, see app/sitemap.ts).
 */
export function invalidateSitemap() {
  try {
    revalidateTag(SITEMAP_TAG);
  } catch (err) {
    console.error("invalidateSitemap failed:", err);
  }
}
