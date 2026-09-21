"use server";

import { redirect } from "next/navigation";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export interface AdminLoginState {
  error: string | null;
}

export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!username || !password) {
    return { error: "نام کاربری و رمز عبور را وارد کنید." };
  }

  const valid = await verifyAdminCredentials(username, password);
  if (!valid) {
    return { error: "نام کاربری یا رمز عبور ادمین اشتباه است." };
  }

  await createAdminSession();
  redirect(next.startsWith("/admin") ? next : "/admin");
}
