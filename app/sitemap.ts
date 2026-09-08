import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getCategories, getActiveRfqs } from "@/lib/queries";

export const revalidate = 3600;

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
