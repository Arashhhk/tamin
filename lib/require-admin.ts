import { getAdminSession } from "./admin-auth";

/**
 * Throws unless the request carries a valid env-based admin session
 * (see lib/admin-auth.ts) — used at the top of every admin-only Server
 * Action so a non-admin can never reach the database mutation,
 * regardless of what the client sends.
 *
 * This is intentionally decoupled from the regular MongoDB user system:
 * "admin" here means "has the ADMIN_USERNAME/ADMIN_PASSWORD session
 * cookie", not "is a User document with role: 'admin'". There is no
 * admin user id to return anymore — callers that previously used
 * requireAdmin()'s return value for a user id (e.g. an audit-trail
 * "reviewedBy" field) have been updated accordingly.
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    throw new Error("دسترسی غیرمجاز — این عملیات فقط برای ادمین است.");
  }
}
