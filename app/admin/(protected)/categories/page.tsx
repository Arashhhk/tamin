import type { Metadata } from "next";
import { getCategoryTree } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import CreateCategoryForm from "./CreateCategoryForm";
import CategoryRow from "./CategoryRow";

export const metadata: Metadata = { title: "دسته‌بندی‌ها | ادمین", robots: { index: false } };
export default async function AdminCategoriesPage() {
  const tree = await getCategoryTree();
  const parentOptions = tree.map((p) => ({ id: p.id, name: p.name }));
  const totalCount = tree.length + tree.reduce((s, p) => s + p.children.length, 0);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">دسته‌بندی‌ها ({formatNumber(totalCount)})</h1>
      </div>

      <CreateCategoryForm parents={parentOptions} />

      <section className="space-y-5">
        {tree.map((parent) => (
          <div key={parent.id} className="space-y-2">
            <CategoryRow
              category={{
                id: parent.id,
                slug: parent.slug,
                name: parent.name,
                icon: parent.icon,
                rfqCount: parent.rfqCount,
                parent: null
              }}
              parents={parentOptions}
            />
            {parent.children.length > 0 && (
              <div className="mr-6 space-y-2 border-r-2 border-camel-100 pr-4">
                {parent.children.map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={{
                      id: child.id,
                      slug: child.slug,
                      name: child.name,
                      icon: child.icon,
                      rfqCount: child.rfqCount,
                      parent: parent.id
                    }}
                    parents={parentOptions}
                    isSubcategory
                  />
                ))}
              </div>
            )}
          </div>
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
