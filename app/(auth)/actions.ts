"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { createSession, clearSession } from "@/lib/auth";
import { isEffectivelySuspended } from "@/lib/violations";
import User from "@/models/User";

export interface AuthFormState {
  error: string | null;
}

/**
 * Both actions below take (prevState, formData) and RETURN an error
 * object instead of throwing — required for useFormState/useActionState
 * on the client to actually display the message on screen. A thrown
 * Error here would surface as Next's generic crash overlay, not a
 * friendly inline message. redirect() on success is the one exception:
 * Next treats it specially (NEXT_REDIRECT) and it still navigates
 * correctly even though it's technically implemented via throw.
 *
 * Any *unexpected* failure (DB unreachable, no internet, etc. — not a
 * validation problem) is caught and mapped to a connectivity-specific
 * message rather than leaking a raw stack trace to the user.
 */
function friendlyConnectionError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|querySrv|MongoNetworkError|buffering timed out/i.test(msg)) {
    return "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.";
  }
  return "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.";
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "buyer") as "buyer" | "seller";

  if (!name || !email || password.length < 8) {
    return { error: "اطلاعات را کامل و درست وارد کنید (رمز عبور حداقل ۸ کاراکتر)." };
  }

  let user;
  try {
    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return { error: "این ایمیل قبلاً ثبت شده است. اگر حساب دارید، وارد شوید." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    user = await User.create({ name, email, passwordHash, role });
  } catch (err) {
    return { error: friendlyConnectionError(err) };
  }

  await createSession({ userId: String(user._id), role: user.role });
  redirect(role === "seller" ? "/seller" : "/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "ایمیل و رمز عبور را وارد کنید." };
  }

  let user;
  try {
    await connectToDatabase();
    user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return { error: "ایمیل یا رمز عبور اشتباه است." };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return { error: "ایمیل یا رمز عبور اشتباه است." };
    }

    if (isEffectivelySuspended(user)) {
      const untilNote =
        user.tempSuspendedUntil && user.status !== "suspended"
          ? ` تا ${new Date(user.tempSuspendedUntil).toLocaleDateString("fa-IR")}`
          : "";
      return { error: `حساب شما توسط مدیریت مسدود شده است${untilNote}.` };
    }
  } catch (err) {
    return { error: friendlyConnectionError(err) };
  }

  await createSession({ userId: String(user._id), role: user.role });
  redirect(user.role === "seller" ? "/seller" : "/");
}

export async function logoutAction() {
  clearSession();
  redirect("/");
}
