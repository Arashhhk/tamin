"use client";

import { useEffect, useState } from "react";

export interface MeUser {
  id: string;
  name: string;
  role: "buyer" | "seller" | "admin";
  sellerTermsAcceptedAt: string | null;
}

const CACHE_KEY = "pelleh:me";

// Module-level (not component-level) so every component calling this
// hook on the same page shares ONE in-flight request instead of each
// firing its own — Header alone needs this in three separate spots
// (the user block, the CTA button rendered twice, the /deals link).
let inFlight: Promise<MeUser | null> | null = null;

function readCache(): MeUser | null | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as MeUser) : null;
  } catch {
    return undefined;
  }
}

function writeCache(user: MeUser | null) {
  try {
    if (user) sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fine, the
    // fetch below still works, subsequent pages just each re-fetch.
  }
}

function fetchMe(): Promise<MeUser | null> {
  if (!inFlight) {
    inFlight = fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        writeCache(data.user);
        return data.user as MeUser | null;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * `undefined` = not known yet this render (nothing to show — render a
 * neutral placeholder, never guess). `null` = confirmed logged out.
 * An object = confirmed logged in.
 *
 * This is the ONLY place any component should learn who's logged in
 * on a page that needs to stay static/cacheable — see
 * app/layout.tsx's removed `force-dynamic` and the comment on
 * app/api/me/route.ts for why this has to be a client-side fetch
 * rather than a Server Component reading cookies() directly.
 */
function readRoleCookie(): string {
  const m = document.cookie.match(/(?:^|; )pelleh_role=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export function useCurrentUser(): MeUser | null | undefined {
  // Always starts as `undefined` on BOTH the server's render pass and
  // the client's first (hydration) render — reading sessionStorage in
  // a useState initializer instead would make the client's first
  // render differ from the server-rendered HTML the moment a cached
  // value exists, which is exactly a React hydration mismatch. Doing
  // the cache read inside the effect below means it only ever runs
  // strictly after hydration has already reconciled successfully.
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    // The freshest signal available without a network round-trip: the
    // `pelleh_role` cookie is re-issued by createSession() (lib/auth.ts)
    // the instant a session is created OR a role changes (login,
    // register, switchRoleAction), synchronously, before any redirect.
    // The `pelleh:me` sessionStorage cache below, by contrast, can be
    // STALE right after exactly that kind of change: switching role
    // redirects client-side (no full document reload), so the cache
    // written by the PREVIOUS page's fetch still holds the old role
    // for as long as it takes the fetch below to resolve. Applying the
    // theme from the cookie first closes that gap — a seller who just
    // switched sees the blue theme immediately, not after a network
    // round trip (or, if the fetch below failed to run for any reason,
    // not at all).
    document.documentElement.classList.toggle("theme-seller", readRoleCookie() === "seller");

    const cached = readCache();
    if (cached !== undefined) {
      setUser(cached);
      applyTheme(cached);
    }
    fetchMe().then((result) => {
      if (cancelled) return;
      setUser(result);
      applyTheme(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}

/**
 * The inline script in app/layout.tsx only runs once, on a full
 * document load — it can't react to a login/logout that happens via
 * a client-side navigation (the <html> element persists across those,
 * so its class never gets re-evaluated), nor to a session that
 * predates the `pelleh_role` cookie existing at all. This keeps the
 * theme class in sync with what /api/me says is actually true,
 * every time a page mounts, covering both cases.
 */
function applyTheme(user: MeUser | null) {
  document.documentElement.classList.toggle("theme-seller", user?.role === "seller");
}
