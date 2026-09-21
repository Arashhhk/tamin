"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitSuggestionAction, type SuggestionFormState } from "./actions";

const initialState: SuggestionFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600 disabled:opacity-60"
    >
      {pending ? "در حال ارسال..." : "ارسال پیشنهاد"}
    </button>
  );
}

export default function SuggestionForm({
  loggedInName
}: {
  loggedInName: string | null;
}) {
  const [state, formAction] = useFormState(submitSuggestionAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl2 border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <p className="text-sm font-bold text-success">پیشنهاد شما ثبت شد. ممنون از وقتی که گذاشتید!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {loggedInName ? (
        <p className="rounded-lg bg-camel-50 px-3 py-2.5 text-xs text-ink-600">
          این پیشنهاد با نام <strong className="text-ink-900">{loggedInName}</strong> ثبت می‌شود.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-800">
              نام شما
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
              ایمیل (اختیاری)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-bold text-ink-800">
          پیشنهاد یا انتقاد شما
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={5}
          maxLength={2000}
          placeholder="هرچه فکر می‌کنید باعث بهتر شدن پله می‌شود را بنویسید..."
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-bold text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
