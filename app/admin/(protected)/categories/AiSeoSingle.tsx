"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateCategorySeoAction } from "./ai-seo-actions";
import AiSeoPreview from "./AiSeoPreview";
import type { GenerateSeoResult } from "@/lib/ai/types";

/** "✨ تولید SEO با AI" for one category: generate → preview → save/discard. */
export default function AiSeoSingle({
  categoryId,
  isComplete,
  onClose
}: {
  categoryId: string;
  isComplete: boolean;
  onClose: () => void;
}) {
  // Incomplete → fill only the empty fields. Complete → full rewrite draft
  // (nothing is replaced until the admin confirms on save).
  const mode: "fill" | "rewrite" = isComplete ? "rewrite" : "fill";
  const [result, setResult] = useState<GenerateSeoResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setResult(null);
    startTransition(async () => setResult(await generateCategorySeoAction(categoryId, mode)));
  }

  return (
    <div className="mt-2 rounded-xl2 border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={run}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-camel-500 px-3 py-1.5 font-bold text-white hover:bg-camel-600 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {pending ? "در حال تولید… (تا ۱ دقیقه)" : result ? "تولید دوباره" : "✨ تولید SEO با AI"}
        </button>
        <span className="text-ink-400">
          {isComplete
            ? "SEO این دسته کامل است؛ فقط پیش‌نویس جایگزین ساخته می‌شود و بدون تأیید شما چیزی عوض نمی‌شود."
            : "فقط فیلدهای خالی تولید می‌شوند."}
        </span>
        <button onClick={onClose} className="mr-auto text-ink-400 hover:text-ink-700">بستن</button>
      </div>

      {result && !result.ok && (
        <p className="mt-3 text-xs font-bold text-danger">
          {result.error} {result.retryable && "(می‌توانید دوباره تلاش کنید)"}
        </p>
      )}
      {result && result.ok && result.status === "skipped" && (
        <p className="mt-3 text-xs text-ink-500">{result.reason}</p>
      )}
      {result && result.ok && result.status === "generated" && (
        <div className="mt-3">
          <AiSeoPreview
            categoryId={categoryId}
            result={result}
            mode={mode}
            onSaved={onClose}
            onDiscard={() => setResult(null)}
          />
        </div>
      )}
    </div>
  );
}
