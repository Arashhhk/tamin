"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { registerAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600 disabled:opacity-60"
    >
      {pending ? "در حال ثبت‌نام..." : "ثبت‌نام"}
    </button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-ink-800">نوع حساب</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-bold has-[:checked]:border-camel-500 has-[:checked]:bg-camel-50 has-[:checked]:text-camel-700">
            <input type="radio" name="role" value="buyer" defaultChecked className="sr-only" />
            خریدار
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-bold has-[:checked]:border-camel-500 has-[:checked]:bg-camel-50 has-[:checked]:text-camel-700">
            <input type="radio" name="role" value="seller" className="sr-only" />
            فروشنده
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-800">
          نام و نام خانوادگی
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>
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
          minLength={8}
          required
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
        <p className="mt-1 text-xs text-ink-400">حداقل ۸ کاراکتر</p>
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
