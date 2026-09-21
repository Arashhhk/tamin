/**
 * Root cause of the "صفحه مورد نظر یافت نشد" bug on category/RFQ pages:
 * the old slugify() kept raw Persian characters in the URL slug
 * (e.g. category "صنعتی" → slug "صنعتی"). Non-ASCII characters in a
 * Next.js dynamic route segment are fragile in practice — Unicode has
 * more than one valid byte representation for the same visible
 * character (e.g. a precomposed "ی" vs. the same letter built from
 * combining marks), and a mismatch can appear between what's typed on
 * a keyboard, what MongoDB stores, and what the browser's
 * URL-encode/decode round-trip produces — even though the text looks
 * identical on screen. The fix, and the standard practice everywhere,
 * is to never put non-ASCII text directly in a URL slug at all.
 *
 * This transliterates common Persian letters to a readable Latin
 * approximation (not academically precise — just enough to produce a
 * recognizable slug like "sanati" for "صنعتی"), strips anything left
 * that isn't a-z0-9-, and — since Persian transliteration can still
 * end up empty or very short for some inputs — always appends a short
 * unique suffix so slugs can never collide or end up blank.
 */

const PERSIAN_TO_LATIN: Record<string, string> = {
  "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s",
  "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
  "ر": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
  "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f",
  "ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n",
  "و": "v", "ه": "h", "ی": "y", "ء": "", "ة": "h", "ۀ": "h",
  "ي": "y", "ك": "k" // Arabic variants some keyboards produce
};

function transliteratePersian(input: string): string {
  return input
    .split("")
    .map((ch) => PERSIAN_TO_LATIN[ch] ?? ch)
    .join("");
}

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Always ASCII-only, always unique. Safe to use directly as a Next.js
 * dynamic route segment.
 */
export function slugify(input: string): string {
  const base = transliteratePersian(input.trim().toLowerCase())
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Persian transliteration can legitimately produce nothing usable
  // (e.g. pure combining marks) — always guarantee a valid, unique slug.
  return base ? `${base}-${uniqueSuffix()}` : uniqueSuffix();
}

/**
 * Same transliteration, but WITHOUT the forced unique suffix — for
 * cases (like a user-supplied slug override) where the caller wants to
 * check for an exact collision first and only fall back to slugify()
 * if needed.
 */
export function slugifyBase(input: string): string {
  return transliteratePersian(input.trim().toLowerCase())
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
