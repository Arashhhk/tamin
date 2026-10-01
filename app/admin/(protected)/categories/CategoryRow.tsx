"use client";

import { useState, useTransition } from "react";
import * as Icons from "lucide-react";
import { Pencil, Trash2, X, Check, Sparkles } from "lucide-react";
import { updateCategoryAction, deleteCategoryAction } from "./actions";
import { formatNumber } from "@/lib/format";
import IconPicker from "./IconPicker";
import AiSeoSingle from "./AiSeoSingle";
import { getMissingSeoFields, parseFaqText } from "@/lib/category-seo";

interface ParentOption {
  id: string;
  name: string;
}

export default function CategoryRow({
  category,
  parents,
  depth = 0
}: {
  category: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    rfqCount: number;
    parent?: string | null;
    seo?: { seoTitle: string; seoDescription: string; description: string; seoContent: string; faqText: string };
  };
  parents: ParentOption[];
  depth?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [slug, setSlug] = useState(category.slug);
  const [parent, setParent] = useState(category.parent || "");
  const [seo, setSeo] = useState(
    category.seo ?? { seoTitle: "", seoDescription: "", description: "", seoContent: "", faqText: "" }
  );
  const [aiOpen, setAiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const Icon = (Icons as any)[icon] ?? Icons.Package;

  function handleSave() {
    setError(null);
    const fd = new FormData();
    fd.set("id", category.id);
    fd.set("name", name);
    fd.set("icon", icon);
    fd.set("slug", slug);
    fd.set("parent", parent);
    fd.set("seoTitle", seo.seoTitle);
    fd.set("seoDescription", seo.seoDescription);
    fd.set("description", seo.description);
    fd.set("seoContent", seo.seoContent);
    fd.set("faq", seo.faqText);
    startTransition(async () => {
      try {
        await updateCategoryAction(fd);
        setEditing(false);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", category.id);
    startTransition(async () => {
      try {
        await deleteCategoryAction(fd);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl2 border border-camel-300 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-[120px] flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm focus:border-camel-400"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            dir="ltr"
            aria-label="نامک (آدرس دسته)"
            placeholder="نامک (slug)"
            className="w-36 rounded-lg border border-line px-2.5 py-1.5 text-xs focus:border-camel-400"
          />
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs focus:border-camel-400"
          >
            <option value="">— دسته اصلی —</option>
            {parents
              .filter((p) => p.id !== category.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <div className="w-40">
            <IconPicker name="icon-unused-in-controlled-mode" defaultValue={icon} onChange={setIcon} />
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            aria-label="ذخیره"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success hover:bg-success/20"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            aria-label="انصراف"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-400 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-400">
          تغییر نامک، آدرس صفحه‌ی دسته را عوض می‌کند؛ آدرس قبلی خودکار به آدرس جدید هدایت می‌شود.
        </p>
        <details className="mt-3 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-bold text-ink-600">
            محتوای سئوی صفحه‌ی دسته (اختیاری)
          </summary>
          <div className="mt-3 space-y-2 text-xs">
            <input
              value={seo.seoTitle}
              onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
              maxLength={70}
              placeholder="عنوان سئو (حداکثر ۷۰ کاراکتر؛ خالی = عنوان خودکار)"
              className="w-full rounded-lg border border-line px-2.5 py-1.5 focus:border-camel-400"
            />
            <input
              value={seo.seoDescription}
              onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })}
              maxLength={170}
              placeholder="توضیح متا (حداکثر ۱۷۰ کاراکتر؛ خالی = توضیح خودکار)"
              className="w-full rounded-lg border border-line px-2.5 py-1.5 focus:border-camel-400"
            />
            <textarea
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
              rows={3}
              placeholder="توضیح دسته (زیر عنوان صفحه نمایش داده می‌شود)"
              className="w-full rounded-lg border border-line px-2.5 py-1.5 focus:border-camel-400"
            />
            <textarea
              value={seo.seoContent}
              onChange={(e) => setSeo({ ...seo, seoContent: e.target.value })}
              rows={6}
              placeholder="محتوای تکمیلی پایین صفحه. پاراگراف‌ها با یک خط خالی جدا شوند؛ خطی که با «## » شروع شود عنوان فرعی است."
              className="w-full rounded-lg border border-line px-2.5 py-1.5 focus:border-camel-400"
            />
            <textarea
              value={seo.faqText}
              onChange={(e) => setSeo({ ...seo, faqText: e.target.value })}
              rows={5}
              placeholder={"سوالات متداول: هر مورد یک بلوک؛ خط اول سوال، خطوط بعد پاسخ؛ بلوک‌ها با یک خط خالی جدا شوند."}
              className="w-full rounded-lg border border-line px-2.5 py-1.5 focus:border-camel-400"
            />
          </div>
        </details>
        {error && <p className="mt-2 text-xs font-bold text-danger">{error}</p>}
      </div>
    );
  }

  const seoComplete =
    getMissingSeoFields({ ...(category.seo ?? {}), faqCount: parseFaqText(category.seo?.faqText ?? "").length }).length === 0;

  return (
    <div>
    <div
      className={`flex items-center justify-between rounded-xl2 border border-line bg-white p-3 ${depth > 0 ? "bg-sand/60" : "shadow-card"}`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span>
          <span className="block text-sm font-bold text-ink-900">{category.name}</span>
          <span className="block text-xs text-ink-400">
            {formatNumber(category.rfqCount)} درخواست فعال · /{category.slug}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <button
          onClick={() => setAiOpen((v) => !v)}
          aria-label="تولید SEO با AI"
          title="✨ تولید SEO با AI"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-camel-50 hover:text-camel-600"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          onClick={() => setEditing(true)}
          aria-label="ویرایش"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-camel-50 hover:text-camel-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label="حذف"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
      {error && <p className="mt-2 text-xs font-bold text-danger">{error}</p>}
    </div>
    {aiOpen && (
      <AiSeoSingle categoryId={category.id} isComplete={seoComplete} onClose={() => setAiOpen(false)} />
    )}
    </div>
  );
}
