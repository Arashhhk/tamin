"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import { createSession } from "@/lib/auth";
import User from "@/models/User";

/**
 * Lets a buyer switch to seller or vice versa — mainly so Google
 * sign-ups (which always default to "buyer", since Google's consent
 * screen has nowhere to ask "buyer or seller?") aren't stuck. Works
 * for regular email/password accounts too, in case someone just picked
 * the wrong option at registration.
 *
 * Not available to admin accounts (there's nothing to switch between).
 *
 * Re-issues the session cookie with the new role immediately — without
 * this, the JWT would still carry the OLD role until the next login,
 * and every role check across the app (middleware, Header, RFQ
 * ownership, etc.) reads the role out of that token.
 */
export async function switchRoleAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("ابتدا وارد حساب خود شوید.");
  if (user.role !== "buyer" && user.role !== "seller") {
    throw new Error("این حساب امکان تغییر نقش را ندارد.");
  }

  const newRole = user.role === "buyer" ? "seller" : "buyer";

  await connectToDatabase();
  await User.findByIdAndUpdate(user._id, { role: newRole });
  await createSession({ userId: String(user._id), role: newRole });

  revalidatePath("/", "layout");
  redirect(newRole === "seller" ? "/seller" : "/");
}
