"use client";

import { useState } from "react";
import Image from "next/image";
import { Gavel } from "lucide-react";

/**
 * Header brand mark. Renders /public/logo.png; if that file is missing or
 * fails to load, falls back to the original orange gavel badge so the
 * header never shows a broken-image icon.
 *
 * SEO/UX notes:
 *  - Fixed 40x40 box (object-contain) → no layout shift, works for square
 *    and wide logos alike.
 *  - `priority` preloads it: it's above the fold on every page (LCP-safe).
 *  - The parent <Link> already carries aria-label="پله - صفحه اصلی", so the
 *    image itself gets alt="" (decorative) to avoid a duplicated announcement;
 *    the visible "پله" text next to it stays in the HTML for crawlers.
 *  - Organization JSON-LD in app/layout.tsx already points at /logo.png.
 */
export default function BrandLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-500 text-white shadow-pop">
        <Gavel className="h-5 w-5" strokeWidth={2.25} />
      </span>
    );
  }

  return (
    <span className="relative block h-10 w-10 shrink-0">
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes="40px"
        priority
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
