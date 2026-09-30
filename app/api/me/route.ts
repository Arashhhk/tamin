import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";

const ROLE_COOKIE_NAME = "pelleh_role"; // see lib/auth.ts

/**
 * Deliberately tiny: only the fields components/HeaderAuth.tsx and
 * components/RoleAwareCTA.tsx actually render (name, role, whether the
 * seller-terms modal must show). Never the full user document — this
 * response has no special access control beyond "you are this
 * session", so it should carry the least data that does the job.
 *
 * This route reads cookies() itself, which is exactly why it exists
 * as its OWN endpoint instead of being called at the top of a page:
 * an API route's dynamism is isolated to itself and has zero bearing
 * on whether the PAGES that fetch it (client-side, after the static
 * HTML has already been served) can be statically generated/cached.
 *
 * It also keeps the non-httpOnly `pelleh_role` cookie honest: sessions
 * created before that cookie existed (or after an account's role
 * changed some other way) get it backfilled here, and a stale one is
 * removed once the session is gone — so the flash-free inline theme
 * script in app/layout.tsx works from the next full page load on.
 */
export async function GET() {
  const user = await getCurrentUser();
  const jar = cookies();

  if (!user) {
    if (jar.get(ROLE_COOKIE_NAME)) jar.delete(ROLE_COOKIE_NAME);
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }

  if (jar.get(ROLE_COOKIE_NAME)?.value !== user.role) {
    jar.set(ROLE_COOKIE_NAME, user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return NextResponse.json(
    {
      user: {
        id: String(user._id),
        name: user.name,
        role: user.role,
        sellerTermsAcceptedAt: user.sellerTermsAcceptedAt
          ? new Date(user.sellerTermsAcceptedAt).toISOString()
          : null
      }
    },
    // This response is per-session (identifies who's asking), so it
    // must never be cached or reused across different visitors — a
    // shared/proxy cache serving one person's name to another would
    // be a real privacy leak, not just a stale-content bug.
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
