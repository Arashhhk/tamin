"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import User from "@/models/User";

export async function toggleVerifiedAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  const user = await User.findById(id);
  if (!user) throw new Error("کاربر یافت نشد");

  user.verified = !user.verified;
  await user.save();
  revalidatePath("/admin/users");
}

export async function toggleStatusAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  // No more "don't suspend yourself" check here — admin is no longer a
  // row in the User collection (see lib/admin-auth.ts), so there's no
  // "self" among these users to protect against.
  const id = String(formData.get("id") || "");

  const user = await User.findById(id);
  if (!user) throw new Error("کاربر یافت نشد");

  const currentlySuspended =
    user.status === "suspended" || (user.tempSuspendedUntil && user.tempSuspendedUntil > new Date());

  if (currentlySuspended) {
    // Un-suspend covers both a manual admin ban and an auto strike-2
    // temporary suspension — clearing both fields so the account is
    // fully usable again, not silently still locked by a lingering date.
    user.status = "active";
    user.tempSuspendedUntil = null;
  } else {
    user.status = "suspended";
  }
  await user.save();
  revalidatePath("/admin/users");
}
