"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Root cause this exists to cover: relying only on route-level
 * loading.tsx works, but it only ever appears if THAT specific
 * navigation happens to suspend for a noticeable moment — a raw <a>
 * tag anywhere bypasses it entirely (fixed two of those already), and
 * even with a proper <Link>, a prefetched/cached destination can swap
 * in fast enough that no visible feedback appears at all. This gives
 * every internal click the same guaranteed feedback regardless of
 * page speed or navigation method: a thin bar starts filling in at
 * the very moment of the click (before Next even starts fetching),
 * and finishes/fades out once the URL actually changes — so the user
 * always sees "your click registered" instead of wondering whether to
 * click again.
 */
function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    function clearTick() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    function startProgress() {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      clearTick();
      setVisible(true);
      setWidth(15);
      // Creeps toward (but never reaches) 90% while waiting — the
      // remaining 10% is reserved for the "snap to 100% and fade out"
      // finish once the URL actually changes, below.
      tickRef.current = setInterval(() => {
        setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.15));
      }, 200);
    }

    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      startProgress();
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTick();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // The URL actually changed — the destination page has taken over.
  // Snap the bar to 100% then fade it out shortly after.
  useEffect(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setWidth(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-camel-500 shadow-[0_0_8px_rgb(var(--camel-500)/0.8)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}

export default function RouteProgress() {
  // useSearchParams needs a Suspense boundary around it per Next.js —
  // harmless no-op fallback since this renders instantly either way.
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
