"use server";

import { redirect } from "next/navigation";
import { clearAdminSession } from "@/lib/admin-auth";

export async function adminLogoutAction() {
  clearAdminSession();
  redirect("/admin/login");
}
