"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Suggestion from "@/models/Suggestion";

export interface SuggestionFormState {
  error: string | null;
  success: boolean;
}

/**
 * Anyone can submit — logged in or not. If the submitter is logged in,
 * their real name/email/role/user-id are captured automatically from
 * the session (not from whatever they might type), so the record can't
 * be spoofed. A guest must type their own name/email instead.
 */
export async function submitSuggestionAction(
  _prevState: SuggestionFormState,
  formData: FormData
): Promise<SuggestionFormState> {
  const message = String(formData.get("message") || "").trim();
  if (!message || message.length < 5) {
    return { error: "متن پیشنهاد را کامل‌تر بنویسید.", success: false };
  }
  if (message.length > 2000) {
    return { error: "متن پیشنهاد خیلی طولانی است (حداکثر ۲۰۰۰ کاراکتر).", success: false };
  }

  try {
    await connectToDatabase();
    const user = await getCurrentUser();

    let name: string;
    let email: string | null;
    let role: "buyer" | "seller" | "admin" | "guest";
    let userId: string | null = null;

    if (user) {
      name = user.name;
      email = user.email;
      role = user.role;
      userId = String(user._id);
    } else {
      name = String(formData.get("name") || "").trim();
      email = String(formData.get("email") || "").trim() || null;
      role = "guest";
      if (!name) {
        return { error: "نام خود را وارد کنید.", success: false };
      }
    }

    await Suggestion.create({ name, email, user: userId, role, message });
    return { error: null, success: true };
  } catch (err) {
    console.error("submitSuggestionAction failed:", err);
    return { error: "ثبت پیشنهاد ناموفق بود. لطفاً دوباره تلاش کنید.", success: false };
  }
}
