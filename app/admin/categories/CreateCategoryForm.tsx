"use client";

import { useRef, useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { createCategoryAction } from "./actions";

const iconSuggestions = [
  "Cog", "Building2", "Cpu", "Truck", "Sprout", "Briefcase", "Layers",
  "Shirt", "FlaskConical", "UtensilsCrossed", "Stethoscope", "Package",
  "Zap", "Mountain", "Sofa", "Laptop", "Printer", "Recycle", "Wrench",
  "HardHat", "Microscope", "Dumbbell", "Smartphone", "Car", "Baby",
  "Factory", "Hammer", "Drill"
];

interface ParentOption {
  id: string;
  name: string;
}

export default function CreateCategoryForm({ parents }: { parents: ParentOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createCategoryAction(formData);
        formRef.current?.reset();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card"
    >
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-bold text-ink-800">نام دسته‌بندی</label>
        <input
          name="name"
          required
          placeholder="مثلاً: شیشه و آینه"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-camel-400"
        />
      </div>
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-bold text-ink-800">دسته‌ی والد (اختیاری)</label>
        <select
          name="parent"
          defaultValue=""
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-camel-400"
        >
          <option value="">— دسته‌ی اصلی (بدون والد) —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-bold text-ink-800">نامک (اختیاری)</label>
        <input
          name="slug"
          placeholder="glass"
          dir="ltr"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-camel-400"
        />
      </div>
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-bold text-ink-800">آیکون</label>
        <input
          name="icon"
          list="icon-suggestions"
          defaultValue="Package"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-camel-400"
        />
        <datalist id="icon-suggestions">
          {iconSuggestions.map((i) => (
            <option key={i} value={i} />
          ))}
        </datalist>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg bg-camel-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-camel-600 disabled:opacity-60"
      >
        <PlusCircle className="h-4 w-4" />
        {isPending ? "در حال افزودن..." : "افزودن دسته‌بندی"}
      </button>
      {error && <p className="w-full text-xs font-bold text-danger">{error}</p>}
    </form>
  );
}
