import type { Metadata } from "next";
import { getFullCategoryTree, getAllCategoriesFlat } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import CreateCategoryForm from "./CreateCategoryForm";
import CategoryTreeNode from "./CategoryTreeNode";

export const metadata: Metadata = { title: "دسته‌بندی‌ها | ادمین", robots: { index: false } };
export default async function AdminCategoriesPage() {
  const [tree, flat] = await Promise.all([getFullCategoryTree(), getAllCategoriesFlat()]);
  // Every category (any depth) is a valid parent choice — labeled by
  // its full breadcrumb path (e.g. "دیجیتال > موبایل") so it's clear
  // where in the tree each option actually sits.
  const parentOptions = flat.map((c) => ({ id: c.id, name: c.path }));
  const totalCount = flat.length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">دسته‌بندی‌ها ({formatNumber(totalCount)})</h1>
      </div>

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
