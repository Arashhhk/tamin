"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { createSession, clearSession } from "@/lib/auth";
import { isEffectivelySuspended } from "@/lib/violations";
import User from "@/models/User";

export async function registerAction(formData: FormData) {
  await connectToDatabase();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "buyer") as "buyer" | "seller";

  if (!name || !email || password.length < 8) {
    throw new Error("اطلاعات را کامل و درست وارد کنید (رمز عبور حداقل ۸ کاراکتر)");
  }

  const existing = await User.findOne({ email });
  if (existing) throw new Error("این ایمیل قبلاً ثبت شده است");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  await createSession({ userId: String(user._id), role: user.role });
  redirect(role === "seller" ? "/seller" : "/");
}

export async function loginAction(formData: FormData) {
  await connectToDatabase();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new Error("ایمیل یا رمز عبور اشتباه است");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("ایمیل یا رمز عبور اشتباه است");

  if (isEffectivelySuspended(user)) {
    const untilNote = user.tempSuspendedUntil && user.status !== "suspended"
      ? ` تا ${new Date(user.tempSuspendedUntil).toLocaleDateString("fa-IR")}`
      : "";
    throw new Error(`حساب شما توسط مدیریت مسدود شده است${untilNote}.`);
  }

  await createSession({ userId: String(user._id), role: user.role });
  redirect(user.role === "seller" ? "/seller" : "/");
}

export async function logoutAction() {
  clearSession();
  redirect("/");
}
