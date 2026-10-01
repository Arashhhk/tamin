"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyCategorySeoAction } from "./ai-seo-actions";
import { SEO_FIELD_LABELS, type SeoField } from "@/lib/category-seo";
import type { GenerateSeoResult } from "@/lib/ai/types";

type Generated = Extract<GenerateSeoResult, { status: "generated" }>;

function hasExisting(r: Generated, f: SeoField) {
  return f === "faq" ? r.existing.faq.length > 0 : Boolean(String((r.existing as any)[f] ?? "").trim());
}

function FieldValue({ r, f, source }: { r: Generated; f: SeoField; source: "draft" | "existing" }) {
  const d: any = source === "draft" ? r.draft : r.existing;
  if (f === "faq") {
    return (
      <ul className="space-y-2">
        {(d.faq as { q: string; a: string }[]).map((x) => (
          <li key={x.q}>
            <span className="block font-bold text-ink-800">{x.q}</span>
            <span className="block text-ink-600">{x.a}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="whitespace-pre-line text-ink-700">{d[f]}</p>;
}

/**
 * Review step: shows what the AI generated next to what exists today and lets
 * the admin choose per field. Saving a field that already has content
 * (= overwriting) needs an explicit confirmation.
 */
export default function AiSeoPreview({
  categoryId,
  result,
  mode,
  onSaved,
  onDiscard
}: {
  categoryId: string;
  result: Generated;
  mode: "fill" | "rewrite";
  onSaved: () => void;
  onDiscard: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<SeoField>>(() => {
    // fill mode: only what's empty. rewrite: everything, but replacing is confirmed on save.
    return new Set(result.generatedFields.filter((f) => mode === "rewrite" || !hasExisting(result, f)));
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(f: SeoField) {
    const next = new Set(selected);
    next.has(f) ? next.delete(f) : next.add(f);
    setSelected(next);
  }

  function save() {
    setError(null);
    const fields = Array.from(selected);
    if (fields.length === 0) return setError("حداقل یک فیلد را انتخاب کنید.");
    const replacing = fields.filter((f) => hasExisting(result, f));
    if (replacing.length > 0) {
      const names = replacing.map((f) => SEO_FIELD_LABELS[f]).join("، ");
      if (!window.confirm(`این فیلدها قبلاً مقدار دارند و جایگزین می‌شوند: ${names}\nادامه می‌دهید؟`)) return;
    }
    startTransition(async () => {
      const res = await applyCategorySeoAction(categoryId, result.draft, fields, replacing.length > 0);
      if (!res.ok) return setError(res.error);
      router.refresh();
      onSaved();
    });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-camel-200 bg-camel-50/40 p-4 text-xs leading-6">
      {result.warnings.length > 0 && (
        <ul className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 font-bold text-ink-700">
          {result.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
      {result.generatedFields.map((f) => {
        const replacing = hasExisting(result, f);
        return (
          <div key={f} className="rounded-lg border border-line bg-white p-3">
            <label className="mb-2 flex items-center gap-2 font-extrabold text-ink-900">
              <input type="checkbox" checked={selected.has(f)} onChange={() => toggle(f)} />
              {SEO_FIELD_LABELS[f]}
              {replacing && <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger">جایگزین مقدار فعلی می‌شود</span>}
              {f === "seoTitle" || f === "seoDescription" ? (
                <span className="font-normal text-ink-400">({String((result.draft as any)[f]).length} کاراکتر)</span>
              ) : null}
            </label>
            <FieldValue r={result} f={f} source="draft" />
            {replacing && (
              <details className="mt-2">
                <summary className="cursor-pointer text-ink-400">مقدار فعلی</summary>
                <div className="mt-1 rounded bg-sand/60 p-2">
                  <FieldValue r={result} f={f} source="existing" />
                </div>
              </details>
            )}
          </div>
        );
      })}
      {error && <p className="font-bold text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-camel-500 px-4 py-1.5 font-bold text-white hover:bg-camel-600 disabled:opacity-60"
        >
          {pending ? "در حال ذخیره…" : "ذخیره انتخاب‌شده‌ها"}
        </button>
        <button
          onClick={onDiscard}
          disabled={pending}
          className="rounded-lg border border-line px-4 py-1.5 font-bold text-ink-600 hover:bg-sand"
        >
          رد کردن
        </button>
      </div>
    </div>
  );
}
