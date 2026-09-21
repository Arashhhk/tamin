import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getGoogleAuthUrl } from "@/lib/google-oauth";

/**
 * GET /api/auth/google — starts the Google sign-in flow.
 * A random `state` value is stored in a short-lived cookie and checked
 * again in the callback route to prevent CSRF on the OAuth redirect.
 */
export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString("hex");

  let authUrl: string;
  try {
    authUrl = getGoogleAuthUrl(state);
  } catch (err: any) {
    // Missing env config — send back to login with a clear message
    // instead of a raw 500.
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600 // 10 minutes, plenty for the redirect round-trip
  });
  return res;
}
