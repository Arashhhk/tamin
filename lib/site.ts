const DEFAULT_SITE_URL = "https://pelleh.ir";

/**
 * Validates NEXT_PUBLIC_SITE_URL before using it anywhere. If it's
 * missing, empty, or not a well-formed absolute URL (e.g. someone sets
 * it to Vercel's own `VERCEL_URL`, which has no protocol — a very
 * common mistake), `new URL(...)` throws. Left unguarded, that throw
 * happens at module-evaluation time in the root layout's `metadata`
 * export, which runs for every page and crashes the entire build.
 * Falling back safely here means a misconfigured env var degrades to a
 * default URL instead of taking down the whole production build.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return DEFAULT_SITE_URL;
  try {
    // `new URL` throws SyntaxError/TypeError on anything not a valid
    // absolute URL (missing protocol, malformed host, etc.).
    const parsed = new URL(raw);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    console.warn(
      `[site] NEXT_PUBLIC_SITE_URL="${raw}" is not a valid absolute URL (e.g. missing "https://"). Falling back to ${DEFAULT_SITE_URL}.`
    );
    return DEFAULT_SITE_URL;
  }
}

export const site = {
  name: "پله",
  nameEn: "Pelleh",
  tagline: "پلتفرم مزایده‌ی تأمین کالا و خدمات",
  description:
    "پله، پلتفرم مزایده‌ی معکوس برای خرید و تأمین کالا: درخواست خرید خود را ثبت کنید تا بهترین فروشندگان برایتان قیمت پیشنهاد دهند.",
  url: resolveSiteUrl(),
  locale: "fa_IR",
  themeColor: "#ff6d41",
  twitter: "@pelleh_market",
  keywords: [
    "مزایده آنلاین",
    "درخواست خرید",
    "تامین کالا",
    "خرید عمده",
    "استعلام قیمت",
    "مناقصه و مزایده",
    "پلتفرم B2B",
    "فروش صنعتی"
  ]
};

export function absoluteUrl(path: string) {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
