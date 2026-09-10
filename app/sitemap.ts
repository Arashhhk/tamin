import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getCategories, getActiveRfqs } from "@/lib/queries";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/categories`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site.url}/rfq`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site.url}/sellers`, changeFrequency: "daily", priority: 0.5 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site.url}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/faq`, changeFrequency: "monthly", priority: 0.4 }
  ];

  const [categories, rfqs] = await Promise.all([
    getCategories(),
    getActiveRfqs({ limit: 5000 })
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7
  }));

  const rfqRoutes: MetadataRoute.Sitemap = rfqs.map((r) => ({
    url: `${site.url}/rfq/${r.slug}`,
    changeFrequency: "hourly",
    priority: 0.6,
    lastModified: r.updatedAt
  }));

  return [...staticRoutes, ...categoryRoutes, ...rfqRoutes];
}
