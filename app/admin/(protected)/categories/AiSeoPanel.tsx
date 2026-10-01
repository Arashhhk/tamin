"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { generateCategorySeoAction, applyCategorySeoAction } from "./ai-seo-actions";
import AiSeoPreview from "./AiSeoPreview";
import { SEO_FIELD_LABELS, type SeoField } from "@/lib/category-seo";
import type { GenerateSeoResult } from "@/lib/ai/types";

export interface AiSeoItem {
  id: string;
  name: string;
  path: string;
  status: "complete" | "partial" | "none";
  missing: SeoField[];
}

const PACE_MS = 6000;

type JobStatus = "pending" | "processing" | "success" | "error" | "skipped" | "saved";
interface Job {
  status: JobStatus;
  result?: Extract<GenerateSeoResult, { status: "generated" }>;
  error?: string;
  retryable?: boolean;
}

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  success: "موفق (منتظر بررسی)",
  error: "خطا",
  skipped: "رد شد (SEO کامل بود)",
  saved: "ذخیره شد"
};
const STATUS_STYLE: Record<JobStatus, string> = {
  pending: "bg-sand text-ink-500",
  processing: "bg-camel-50 text-camel-700",
  success: "bg-success/10 text-success",
  error: "bg-danger/10 text-danger",
  skipped: "bg-sand text-ink-500",
  saved: "bg-success/20 text-success"
};
const BADGE: Record<AiSeoItem["status"], { label: string; cls: string }> = {
  complete: { label: "کامل", cls: "bg-success/10 text-success" },
  partial: { label: "ناقص", cls: "bg-warning/20 text-ink-700" },
  none: { label: "خالی", cls: "bg-danger/10 text-danger" }
};

export default function AiSeoPanel({ items, aiConfigured }: { items: AiSeoItem[]; aiConfigured: boolean }) {
  const router = useRouter();
  const total = items.length;
  const complete = items.filter((i) => i.status === "complete").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const none = items.filter((i) => i.status === "none").length;

  const [mode, setMode] = useState<"fill" | "rewrite">("fill");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.status !== "complete").map((i) => i.id))
  );
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  const setJob = (id: string, job: Job) => setJobs((j) => ({ ...j, [id]: job }));

  function changeMode(m: "fill" | "rewrite") {
    setMode(m);
    setSelected(m === "fill" ? new Set(items.filter((i) => i.status !== "complete").map((i) => i.id)) : new Set());
  }
  function toggle(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }

  // Sequential, one category per request → each call stays far below any
  // serverless timeout no matter how many categories there are, and one
  // failure never stops the rest.
  async function run(ids: string[]) {
    if (ids.length === 0 || running) return;
    stopRef.current = false;
    setRunning(true);
    ids.forEach((id) => setJob(id, { status: "pending" }));
    let first = true;
    for (const id of ids) {
      // Gemini's free tier allows only a handful of requests per minute, so
      // consecutive categories are spaced out instead of tripping the limit.
      if (!first && !stopRef.current) await new Promise((r) => setTimeout(r, PACE_MS));
      first = false;
      if (stopRef.current) {
        setJob(id, { status: "pending" });
        continue;
      }
      setJob(id, { status: "processing" });
      try {
        const r = await generateCategorySeoAction(id, mode);
        if (!r.ok) setJob(id, { status: "error", error: r.error, retryable: r.retryable });
        else if (r.status === "skipped") setJob(id, { status: "skipped" });
        else setJob(id, { status: "success", result: r });
      } catch (err: any) {
        setJob(id, { status: "error", error: err?.message ?? "خطا", retryable: true });
      }
    }
    setRunning(false);
  }

  const idsToRun = items
    .filter((i) => selected.has(i.id) && (mode === "rewrite" || i.status !== "complete"))
    .map((i) => i.id);
  const failedIds = Object.entries(jobs).filter(([, j]) => j.status === "error" && j.retryable).map(([id]) => id);
  const successIds = Object.entries(jobs).filter(([, j]) => j.status === "success").map(([id]) => id);

  async function saveAllSuccessful() {
    if (successIds.length === 0) return;
    const willReplace = mode === "rewrite";
    if (
      !window.confirm(
        willReplace
          ? `اطلاعات SEO فعلی ${successIds.length} دسته با نسخه‌ی تولیدشده جایگزین می‌شود. ادامه می‌دهید؟`
          : `برای ${successIds.length} دسته، فقط فیلدهای خالی پر می‌شود. ادامه می‌دهید؟`
      )
    )
      return;
    for (const id of successIds) {
      const r = jobs[id].result!;
      const fields = r.generatedFields;
      const res = await applyCategorySeoAction(id, r.draft, fields, willReplace);
      setJob(id, res.ok ? { status: "saved" } : { status: "error", error: res.error, retryable: false });
    }
    router.refresh();
  }

  return (
    <section className="mb-8 rounded-xl2 border border-line bg-white p-5 shadow-card">
      <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-ink-900">
        <Sparkles className="h-4 w-4 text-camel-500" />
        🤖 تکمیل SEO با هوش مصنوعی
      </h2>
      <p className="mb-4 text-xs text-ink-500">
        پیش‌نویس تولید می‌شود و فقط بعد از تأیید شما ذخیره می‌شود. مقدارهای فعلی بدون اجازه‌ی شما عوض نمی‌شوند.
      </p>

      {!aiConfigured && (
        <p className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs font-bold text-ink-700">
          کلید Gemini تنظیم نشده است. GEMINI_API_KEY را در فایل .env.local بگذارید و سرور را دوباره اجرا کنید.
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
        {[
          ["کل دسته‌ها", total, "text-ink-900"],
          ["SEO کامل", complete, "text-success"],
          ["ناقص", partial, "text-ink-700"],
          ["بدون SEO", none, "text-danger"]
        ].map(([label, n, cls]) => (
          <div key={String(label)} className="rounded-lg border border-line p-2.5">
            <div className={`text-lg font-extrabold ${cls}`}>{Number(n).toLocaleString("fa-IR")}</div>
            <div className="text-ink-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "fill"} onChange={() => changeMode("fill")} disabled={running} />
          تکمیل دسته‌های ناقص (فقط فیلدهای خالی)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={mode === "rewrite"} onChange={() => changeMode("rewrite")} disabled={running} />
          بازنویسی SEO (نیازمند تأیید شما قبل از جایگزینی)
        </label>
      </div>

      <details className="mb-3 rounded-lg border border-line" open={total <= 12}>
        <summary className="cursor-pointer p-2.5 text-xs font-bold text-ink-700">
          انتخاب دسته‌ها ({selected.size.toLocaleString("fa-IR")} انتخاب‌شده)
        </summary>
        <div className="border-t border-line p-2.5">
          <div className="mb-2 flex gap-3 text-[11px]">
            <button className="text-camel-600 hover:underline" disabled={running}
              onClick={() => setSelected(new Set(items.filter((i) => i.status !== "complete").map((i) => i.id)))}>
              انتخاب همه‌ی ناقص‌ها
            </button>
            <button className="text-camel-600 hover:underline" disabled={running}
              onClick={() => setSelected(new Set(items.map((i) => i.id)))}>
              انتخاب همه
            </button>
            <button className="text-ink-400 hover:underline" disabled={running} onClick={() => setSelected(new Set())}>
              پاک کردن
            </button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} disabled={running} />
                <span className="text-ink-700">{i.path}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${BADGE[i.status].cls}`}>
                  {BADGE[i.status].label}
                </span>
                {i.status === "partial" && (
                  <span className="text-[10px] text-ink-400">
                    (خالی: {i.missing.map((f) => SEO_FIELD_LABELS[f]).join("، ")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => run(idsToRun)}
          disabled={running || !aiConfigured || idsToRun.length === 0}
          className="rounded-lg bg-camel-500 px-4 py-2 font-bold text-white hover:bg-camel-600 disabled:opacity-50"
        >
          {running ? "در حال تولید…" : `تولید برای ${idsToRun.length.toLocaleString("fa-IR")} دسته`}
        </button>
        {running && (
          <button onClick={() => (stopRef.current = true)} className="rounded-lg border border-line px-3 py-2 font-bold text-ink-600">
            توقف
          </button>
        )}
        {!running && failedIds.length > 0 && (
          <button onClick={() => run(failedIds)} className="rounded-lg border border-danger/40 px-3 py-2 font-bold text-danger">
            تلاش دوباره برای {failedIds.length.toLocaleString("fa-IR")} خطا
          </button>
        )}
        {!running && successIds.length > 0 && (
          <button onClick={saveAllSuccessful} className="rounded-lg border border-success/40 px-3 py-2 font-bold text-success">
            ذخیره همه‌ی موفق‌ها ({successIds.length.toLocaleString("fa-IR")})
          </button>
        )}
      </div>

      {Object.keys(jobs).length > 0 && (
        <ul className="mt-4 space-y-2">
          {items
            .filter((i) => jobs[i.id])
            .map((i) => {
              const j = jobs[i.id];
              return (
                <li key={i.id} className="rounded-lg border border-line p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-800">{i.path}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[j.status]}`}>
                      {STATUS_LABEL[j.status]}
                    </span>
                    {j.status === "error" && (
                      <span className="text-danger">
                        {j.error}
                        {j.retryable && !running && (
                          <button className="mr-2 font-bold underline" onClick={() => run([i.id])}>
                            تلاش دوباره
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {j.status === "success" && j.result && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-bold text-camel-600">مشاهده و بررسی پیش‌نویس</summary>
                      <div className="mt-2">
                        <AiSeoPreview
                          categoryId={i.id}
                          result={j.result}
                          mode={mode}
                          onSaved={() => setJob(i.id, { status: "saved" })}
                          onDiscard={() => setJobs((all) => {
                            const { [i.id]: _drop, ...rest } = all;
                            return rest;
                          })}
                        />
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
