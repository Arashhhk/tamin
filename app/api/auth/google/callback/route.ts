import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { isEffectivelySuspended } from "@/lib/violations";
import { exchangeGoogleCode } from "@/lib/google-oauth";
import User from "@/models/User";

/**
 * GET /api/auth/google/callback
 *
 * Finds an existing user by the Google account's email, or creates one.
 * New Google sign-ups default to role "buyer" — Google's consent
 * screen has no place to ask "buyer or seller?", so this picks the
 * more common case. A seller signing up via Google today would need an
 * admin to flip their role, or to register normally with email/password
 * and choose "فروشنده" there instead.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("google_oauth_state")?.value;

  const failRedirect = (reason: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (!code || !state || !storedState || state !== storedState) {
    return failRedirect("google_state_mismatch");
  }

  let googleUser;
  try {
    googleUser = await exchangeGoogleCode(code);
  } catch (err) {
    console.error("Google OAuth exchange failed:", err);
    return failRedirect("google_exchange_failed");
  }

  if (!googleUser.email || !googleUser.email_verified) {
    return failRedirect("google_email_unverified");
  }

  try {
    await connectToDatabase();
    const email = googleUser.email.toLowerCase();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: googleUser.name || email.split("@")[0],
        email,
        // Google-authenticated accounts don't use a local password;
        // store a random unusable hash so the schema's required field
        // is satisfied and email/password login is simply never able
        // to match it.
        passwordHash: `google-oauth:${randomUUID()}`,
        role: "buyer",
        verified: true,
        avatarUrl: googleUser.picture
      });
    } else if (isEffectivelySuspended(user)) {
      return failRedirect("account_suspended");
    }

    await createSession({ userId: String(user._id), role: user.role });
    return NextResponse.redirect(new URL(user.role === "seller" ? "/seller" : "/", req.url));
  } catch (err) {
    console.error("Google OAuth user upsert failed:", err);
    return failRedirect("server_error");
  }
}
