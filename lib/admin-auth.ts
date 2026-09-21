import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Admin panel authentication — entirely separate from the regular
 * buyer/seller/admin user system in MongoDB (see lib/auth.ts).
 *
 * By design:
 *   - Anyone can navigate to /admin (the route itself isn't blocked by
 *     IP, browser, or anything else) — but without a valid admin
 *     session they're redirected to /admin/login.
 *   - Credentials are NOT a MongoDB user's email/password. They're a
 *     single username + password pair set in .env.local
 *     (ADMIN_USERNAME / ADMIN_PASSWORD), checked directly against the
 *     environment — nothing about "which email happens to be logged
 *     into the browser" matters here.
 *   - On success, a separate signed cookie (pelleh_admin_session) is
 *     issued, independent of the regular pelleh_session cookie — a
 *     person can be logged in as a buyer AND as admin at the same time
 *     in the same browser, or neither, or either alone.
 */

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
const ADMIN_COOKIE_NAME = "pelleh_admin_session";

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    console.warn(
      "[admin-auth] ADMIN_USERNAME/ADMIN_PASSWORD not set in .env.local — admin login will always fail until configured."
    );
    return false;
  }

  return username === expectedUser && password === expectedPass;
}

export async function createAdminSession() {
  const token = await new SignJWT({ isAdmin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12 // 12h — shorter-lived than the regular user session on purpose
  });
}

export async function getAdminSession(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE_NAME);
}
