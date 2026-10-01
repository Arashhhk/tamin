import type { Metadata } from "next";
import { getFullCategoryTree, getAllCategoriesFlat } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import CreateCategoryForm from "./CreateCategoryForm";
import CategoryTreeNode from "./CategoryTreeNode";
import AiSeoPanel, { type AiSeoItem } from "./AiSeoPanel";
import { isAiConfigured } from "@/lib/ai/provider";
import { getMissingSeoFields, getSeoStatus, parseFaqText } from "@/lib/category-seo";

// AI generation runs per category inside a server action (~up to a minute).
export const maxDuration = 60;

export const metadata: Metadata = { title: "دسته‌بندی‌ها | ادمین", robots: { index: false } };
export default async function AdminCategoriesPage() {
  const [tree, flat] = await Promise.all([getFullCategoryTree(), getAllCategoriesFlat()]);
  // Every category (any depth) is a valid parent choice — labeled by
  // its full breadcrumb path (e.g. "دیجیتال > موبایل") so it's clear
  // where in the tree each option actually sits.
  const parentOptions = flat.map((c) => ({ id: c.id, name: c.path }));
  const totalCount = flat.length;

  const aiItems: AiSeoItem[] = flat.map((c) => {
    const missing = getMissingSeoFields({ ...c.seo, faqCount: parseFaqText(c.seo.faqText).length });
    return { id: c.id, name: c.name, path: c.path, status: getSeoStatus(missing), missing };
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">دسته‌بندی‌ها ({formatNumber(totalCount)})</h1>
      </div>

      {aiItems.length > 0 && <AiSeoPanel items={aiItems} aiConfigured={isAiConfigured()} />}

      <CreateCategoryForm parents={parentOptions} />

      <section className="space-y-5">
        {tree.map((root) => (
          <CategoryTreeNode key={root.id} node={root} depth={0} allParentOptions={parentOptions} />
        ))}
        {tree.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
            هنوز دسته‌بندی‌ای ثبت نشده است.
          </p>
        )}
      </section>
    </>
  );
}
