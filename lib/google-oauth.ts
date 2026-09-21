import { site } from "./site";

/**
 * Minimal, dependency-free Google OAuth 2.0 (Authorization Code flow).
 * No next-auth or any other package added — just fetch calls to
 * Google's own endpoints — to avoid introducing new install-risk.
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.
 * The redirect URI is derived from NEXT_PUBLIC_SITE_URL, so it must
 * match EXACTLY (protocol + host, no trailing slash) what's registered
 * in the Google Cloud Console for this OAuth client, plus the path
 * below — see README for setup steps.
 */

export function getGoogleRedirectUri() {
  return `${site.url}/api/auth/google/callback`;
}

export function getGoogleAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID تنظیم نشده است.");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID یا GOOGLE_CLIENT_SECRET تنظیم نشده است.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code"
    })
  });

  if (!tokenRes.ok) {
    throw new Error(`تبادل کد گوگل ناموفق بود: ${await tokenRes.text()}`);
  }
  const tokens: GoogleTokenResponse = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!userRes.ok) {
    throw new Error("دریافت اطلاعات کاربر از گوگل ناموفق بود.");
  }
  return userRes.json();
}
