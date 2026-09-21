"use client";

import { useTransition } from "react";
import { Check, Trash2, Mail } from "lucide-react";
import { markSuggestionReadAction, deleteSuggestionAction } from "./actions";

const roleLabels: Record<string, string> = {
  buyer: "خریدار",
  seller: "فروشنده",
  admin: "ادمین",
  guest: "مهمان"
};

interface Suggestion {
  id: string;
  name: string;
  email: string | null;
  role: string;
  message: string;
  status: "new" | "read";
  createdAt: string;
}

export default function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const [isPending, startTransition] = useTransition();

  function handleMarkRead() {
    const fd = new FormData();
    fd.set("id", suggestion.id);
    startTransition(async () => {
      await markSuggestionReadAction(fd);
    });
  }

  function handleDelete() {
    if (!confirm("این پیشنهاد حذف شود؟")) return;
    const fd = new FormData();
    fd.set("id", suggestion.id);
    startTransition(async () => {
      await deleteSuggestionAction(fd);
    });
  }

  return (
    <div
      className={`rounded-xl2 border p-4 shadow-card ${
        suggestion.status === "new" ? "border-camel-300 bg-camel-50/40" : "border-line bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
            {suggestion.name}
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
              {roleLabels[suggestion.role] ?? suggestion.role}
            </span>
            {suggestion.status === "new" && (
              <span className="rounded-full bg-camel-500 px-2 py-0.5 text-[10px] font-bold text-white">
                جدید
              </span>
            )}
          </p>
          {suggestion.email && (
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-400" dir="ltr">
              <Mail className="h-3 w-3" />
              {suggestion.email}
            </p>
          )}
        </div>
        <span className="text-[11px] text-ink-400">
          {new Date(suggestion.createdAt).toLocaleString("fa-IR")}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-700">{suggestion.message}</p>

      <div className="mt-3 flex gap-2">
        {suggestion.status === "new" && (
          <button
            onClick={handleMarkRead}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:border-success/40 hover:text-success disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            علامت به‌عنوان خوانده‌شده
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:border-danger/40 hover:text-danger disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف
        </button>
      </div>
    </div>
  );
}
