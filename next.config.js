/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.pelleh.ir" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  async headers() {
    return [
      {
        // Security headers applied to every route — part of the SEO/trust
        // baseline (Google factors HTTPS + safe-browsing signals into ranking).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          }
        ]
      },
      {
        // Fonts are versioned by file name → safe to cache "forever".
        source: "/(.*)\\.(woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        // Files dropped into /public (logo.png, og-cover.png, hero image...)
        // keep the SAME URL when replaced. With `immutable` + 1 year, a
        // returning visitor's browser would never fetch a replaced logo.
        // (Hashed /_next/static assets already get immutable from Next.)
        source: "/(.*)\\.(svg|jpg|jpeg|png|webp|avif)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Canonical host + trailing-slash consistency avoids duplicate-content
      // penalties — set NEXT_PUBLIC_SITE_URL in .env and mirror it here in prod.
    ];
  }
};

module.exports = nextConfig;
