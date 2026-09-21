"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? "در حال ورود..." : "ورود به پنل ادمین"}
    </button>
  );
}

export default function AdminLoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(adminLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-bold text-ink-800">
          نام کاربری
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-ink-400"
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
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-ink-400"
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
