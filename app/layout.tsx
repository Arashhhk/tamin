import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * Forces every route in the app to render dynamically (per-request)
 * instead of being statically generated at build time.
 *
 * Root cause this fixes: `Header` and `Footer` — rendered on nearly
 * every page — are async Server Components that call
 * `connectToDatabase()` (via `getCurrentUser()`, `getParentCategories()`,
 * `getCategoryTree()`, etc.). Without this flag, Next.js's build
 * process tries to statically pre-render pages during "Generating
 * static pages", which means executing those components AT BUILD TIME
 * — attempting a live MongoDB connection from Vercel's build
 * environment. That connection isn't guaranteed to succeed (build
 * servers may not have DB network access, or MONGODB_URI may not be
 * exposed at build time), so the export step throws and the whole
 * build fails.
 *
 * This app has no page that's actually static in practice — Header
 * shows live auth state and Footer shows live category counts on every
 * single route — so declaring the whole app dynamic here is the
 * accurate fix, not a workaround: it tells Next.js the truth about
 * this app's rendering requirements in one place, instead of patching
 * it onto every individual page.
 */
export const dynamic = "force-dynamic";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
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
  alternates: {
    canonical: "/",
    languages: {
      "fa-IR": "/",
      "x-default": "/"
    }
  },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
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
    description: site.description,
    sameAs: []
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: "fa-IR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-sans antialiased">
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
