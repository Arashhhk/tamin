import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";
import { site } from "@/lib/site";
import RouteProgress from "@/components/RouteProgress";
import "./globals.css";

/**
 * Role-based theming (buyer/guest → orange, seller → sky blue — see
 * globals.css's `.theme-seller`) used to be decided server-side by
 * reading the real session cookie via getCurrentUser(), which is
 * exactly what forced the ENTIRE app into force-dynamic rendering
 * (see the notice previously here, and app/api/me/route.ts's comment
 * for the full explanation). This inline script reproduces the same
 * flash-free result a different way: `pelleh_role` (see lib/auth.ts)
 * is a second, non-httpOnly cookie carrying ONLY the role string — no
 * session, no PII — so plain browser JS can read it and add the class
 * to <html> itself, with zero server involvement.
 *
 * `strategy="beforeInteractive"` is what makes this flash-free: Next.js
 * injects this into the actual HTML <head> and runs it while the
 * document is still parsing, before the browser paints <body> — the
 * same mechanism most "avoid dark-mode flash" solutions use, applied
 * here to role-based theming instead.
 */
const themeScript = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )pelleh_role=([^;]*)/);
    var role = m ? decodeURIComponent(m[1]) : "";
    if (role === "seller") document.documentElement.classList.add("theme-seller");
  } catch (e) {}
})();
`;

const vazir = Vazirmatn({
  subsets: ["arabic"],
  // Three separate CSS variables, ALL pointing at the same font for
  // now — this is the placeholder state. Once real font files are
  // dropped in (see README, "سیستم سه‌فونتی"), each of these three
  // `next/font/local` declarations gets swapped in independently,
  // and every `font-heading` / `font-body` / `.num` class already
  // wired up project-wide (see tailwind.config.js + globals.css)
  // picks up the real fonts automatically — no other file changes.
  variable: "--font-heading",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"]
});

const vazirBody = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-body",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"]
});

const vazirNumeral = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-numeral",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"]
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`
  },
  description: site.description,
  keywords: site.keywords,
  applicationName: site.name,
  authors: [{ name: site.name }],
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  // No site-wide `alternates` here on purpose: a root-level canonical "/"
  // (and hreflang "/" entries) were inherited by EVERY page that doesn't
  // declare its own alternates (dashboards, error pages, ...), telling
  // Google their canonical is the homepage. Each indexable page declares
  // its own canonical instead. The site is single-language (fa), so no
  // hreflang set is needed.
  openGraph: {
    type: "website",
    locale: site.locale,
    // No fixed `url` here: it would be inherited as og:url = homepage on
    // every page that doesn't override openGraph.
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: site.name }]
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitter,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: ["/og-cover.png"]
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: site.themeColor
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    alternateName: site.nameEn,
    url: site.url,
    logo: `${site.url}/logo.png`,
    description: site.description
    // Add `sameAs` only when real social profile URLs exist — an empty
    // array is meaningless markup.
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: "fa-IR"
    // No SearchAction here: it pointed at /search?q=..., a route that
    // doesn't exist anywhere in this app. Structured data pointing at
    // a URL Google can't actually crawl is worse than no markup at
    // all — this can come back the moment a real, crawlable search
    // route exists.
  };

  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${vazir.variable} ${vazirBody.variable} ${vazirNumeral.variable}`}
    >
      <body className="font-sans antialiased">
        <Script id="role-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <RouteProgress />
        <script
          type="application/ld+json"
          // Structured data: helps Google render the sitelinks search box
          // and knowledge-panel identity for the brand.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
