import { getCurrentUser } from "./current-user";

/**
 * Throws unless the current session belongs to an admin. Used at the top
 * of every admin-only Server Action so a non-admin can never reach the
 * database mutation, regardless of what the client sends.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("دسترسی غیرمجاز — این عملیات فقط برای ادمین است.");
  }
  return user;
}
