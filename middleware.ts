import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

const regularProtectedPrefixes = ["/profile", "/seller", "/rfq/new"];

/**
 * /admin is handled entirely separately from the regular
 * buyer/seller/admin user session (see lib/admin-auth.ts): it checks
 * its own `pelleh_admin_session` cookie, issued only by successfully
 * submitting the ADMIN_USERNAME/ADMIN_PASSWORD form at /admin/login —
 * never the regular email/password login.
 */
async function hasValidAdminSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("pelleh_admin_session")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const validAdmin = await hasValidAdminSession(req);

    if (isLoginPage) {
      // Already authenticated as admin and revisiting the login page —
      // just send them straight in instead of showing the form again.
      if (validAdmin) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }

    if (!validAdmin) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const needsAuth = regularProtectedPrefixes.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("pelleh_session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (pathname.startsWith("/seller") && role !== "seller") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/rfq/new") && role !== "buyer") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/profile/:path*", "/seller/:path*", "/admin/:path*", "/rfq/new"]
};
