"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { loginAction, type AuthFormState } from "../actions";

const googleErrorMessages: Record<string, string> = {
  google_not_configured: "ورود با گوگل فعلاً پیکربندی نشده است.",
  google_state_mismatch: "درخواست ورود با گوگل نامعتبر بود، دوباره تلاش کنید.",
  google_exchange_failed: "ورود با گوگل ناموفق بود، دوباره تلاش کنید.",
  google_email_unverified: "ایمیل حساب گوگل شما تایید نشده است.",
  account_suspended: "حساب شما توسط مدیریت مسدود شده است.",
  server_error: "خطای سرور. لطفاً دوباره تلاش کنید."
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600 disabled:opacity-60"
    >
      {pending ? "در حال ورود..." : "ورود"}
    </button>
  );
}

export default function LoginForm({ googleError }: { googleError?: string }) {
  const initialState: AuthFormState = {
    error: googleError ? googleErrorMessages[googleError] || "خطایی رخ داد." : null
  };
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-800">
          ایمیل
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink-800">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-bold text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
