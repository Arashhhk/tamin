import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/profile/",
          // "/seller" as a bare prefix also matched the PUBLIC /sellers
          // directory (listed in the sitemap) and blocked it from crawling.
          // "/seller$" = the dashboard only; "/seller/" = anything under it.
          "/seller$",
          "/seller/",
          "/deals",
          // NOT "/(auth)/" — that's a Next.js route-group folder name
          // and never appears in the actual URL (app/(auth)/login/page.tsx
          // serves at /login, not /(auth)/login), so that rule blocked
          // nothing at all. The real paths are listed below; /rfq/new
          // is deliberately left crawlable — it already carries
          // `noindex, follow` via its own metadata (see
          // app/rfq/new/page.tsx) rather than a robots.txt block,
          // since its meta tag explicitly wants links on it followed,
          // and a robots.txt disallow would stop Google from ever
          // reading that meta tag in the first place.
          "/login",
          "/register"
          // NOT "/*?*sort=" / "/*?*page=": blocking these in robots.txt
          // stops Google from ever reading their canonical/noindex tags,
          // so they can linger in the index as URL-only entries.
          // Duplicates/pagination are handled with canonical + robots
          // meta on the pages themselves instead.
        ]
      }
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url
  };
}
