import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
const COOKIE_NAME = "pelleh_session";
// Companion, NON-httpOnly cookie carrying ONLY the role — no id, no
// name, no PII. Its sole purpose is letting client-side code (see
// components/HeaderAuth.tsx, RoleAwareCTA.tsx, and the inline theme
// script in app/layout.tsx) render the right logged-in-vs-guest /
// buyer-vs-seller UI on first paint WITHOUT a Server Component reading
// the real session cookie via `cookies()` — that read is what forces
// an entire route to render dynamically in Next.js's App Router.
// Reading this cookie client-side has no such effect, since it's
// plain browser JS, not one of Next's server Dynamic APIs. Being
// readable by JS is fine specifically because it carries nothing
// sensitive; the actual session (COOKIE_NAME above) stays httpOnly as
// before for every real auth check.
const ROLE_COOKIE_NAME = "pelleh_role";

export interface SessionPayload {
  userId: string;
  role: "buyer" | "seller" | "admin";
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const maxAge = 60 * 60 * 24 * 30;
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });
  cookies().set(ROLE_COOKIE_NAME, payload.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
  cookies().delete(ROLE_COOKIE_NAME);
}
