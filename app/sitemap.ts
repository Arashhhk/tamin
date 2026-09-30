import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { site } from "@/lib/site";
import { getCategories, getRfqsForSitemap, getPublishedArticles } from "@/lib/queries";
import { SITEMAP_TAG } from "@/lib/sitemap-cache";
import { isCategoryIndexable } from "@/lib/category-seo";

/**
 * Forces this sitemap to be generated at REQUEST time, not build time.
 *
 * sitemap.ts is a special Next.js route file, not a child of
 * app/layout.tsx — it sits outside the normal React render tree, so
 * `export const dynamic` in the root layout does NOT apply to it. It
 * needs this declared here explicitly. Without it, Next.js tries to
 * pre-render /sitemap.xml at build time (this file previously used
 * `export const revalidate = 3600`, which implies static generation
 * with periodic revalidation — still a build-time attempt), which
 * means calling getCategories()/getActiveRfqs() — and therefore
 * connecting to MongoDB — during the Vercel build itself. Requirement:
 * no DB access during build. This defers that entirely to real
 * requests, where a live DB connection is expected to exist.
 */
export const dynamic = "force-dynamic";

// The actual caching layer: force-dynamic (above) only controls
// whether Next attempts to pre-render this at build time — it doesn't
// stop every single runtime request from re-hitting MongoDB. Wrapping
// just the data-fetching part in unstable_cache gives it a real
// server-side cache with a time-based revalidation, independent of
// the route segment's own dynamic/static setting, so a crawler
// re-fetching /sitemap.xml repeatedly doesn't turn into repeated
// Mongo round-trips.
const getSitemapData = unstable_cache(
  async () => {
    const [categories, rfqs, articles] = await Promise.all([
      getCategories(),
      getRfqsForSitemap(),
      getPublishedArticles(1000)
    ]);
    return { categories, rfqs, articles };
  },
  ["sitemap-data"],
  // 5 minutes max staleness (an RFQ that merely EXPIRES by time changes no
  // event we could hook), plus on-demand invalidation via the "sitemap" tag
  // whenever an RFQ is created / selected / completed / cancelled or a
  // category's content changes (see lib/sitemap-cache.ts).
  { revalidate: 300, tags: ["categories", SITEMAP_TAG] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/categories`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site.url}/rfq`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site.url}/sellers`, changeFrequency: "daily", priority: 0.5 },
    { url: `${site.url}/buyers`, changeFrequency: "daily", priority: 0.4 },
    { url: `${site.url}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.1 }
    // Deliberately NOT included: /blog (placeholder, noindex — see
    // app/blog/page.tsx), and anything private/transactional
    // (/login, /register, /profile, /seller, /rfq/new, /deals,
    // /admin) — a sitemap should only ever list canonical, indexable
    // URLs; listing a noindex or private page here actively confuses
    // crawlers about what the sitemap promises.
  ];

  const { categories, rfqs, articles } = await getSitemapData();

  // Must mirror app/categories/[slug]/page.tsx's robots rule: a branch
  // (has subcategories) is a real hub page; a leaf is only listed while it
  // has at least one open auction. Empty leaves are noindex → not in sitemap.
  const parentIds = new Set(categories.map((c) => c.parent).filter(Boolean) as string[]);
  const indexableCategories = categories.filter((c) =>
    isCategoryIndexable({ isParent: parentIds.has(c.id), openRfqCount: c.rfqCount, hasContent: c.hasContent })
  );

  const categoryRoutes: MetadataRoute.Sitemap = indexableCategories.map((c) => ({
    url: `${site.url}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
    ...(c.updatedAt ? { lastModified: c.updatedAt } : {})
  }));

  const rfqRoutes: MetadataRoute.Sitemap = rfqs.map((r) => ({
    url: `${site.url}/rfq/${r.slug}`,
    // Live auctions change constantly; archived (completed) ones are static
    // reference pages — see getRfqSeoState() in lib/rfq-seo.ts.
    changeFrequency: r.bucket === "active" ? "hourly" : "monthly",
    priority: r.bucket === "active" ? 0.6 : 0.3,
    lastModified: r.updatedAt
  }));

  // /blog and its articles are listed only once real published articles
  // exist (the index is noindex until then — see app/blog/page.tsx).
  const blogRoutes: MetadataRoute.Sitemap =
    articles.length > 0
      ? [
          { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.5 },
          ...articles.map((a) => ({
            url: `${site.url}/blog/${a.slug}`,
            changeFrequency: "monthly" as const,
            priority: 0.5,
            ...(a.updatedAt ? { lastModified: a.updatedAt } : {})
          }))
        ]
      : [];

  return [...staticRoutes, ...categoryRoutes, ...rfqRoutes, ...blogRoutes];
}
