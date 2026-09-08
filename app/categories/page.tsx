import type { Metadata } from "next";
import Link from "next/link";
import * as Icons from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategoryTree } from "@/lib/queries";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "همه دسته‌بندی‌ها",
  description: "دسته‌بندی‌های کالا و خدمات روی تامین به همراه زیردسته‌های کامل هرکدام.",
  alternates: { canonical: "/categories" }
};

export const revalidate = 60;

export default async function CategoriesPage() {
  const categoryTree = await getCategoryTree();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-extrabold text-ink-900">دسته‌بندی‌ها</h1>
        <p className="mb-8 text-sm text-ink-500">
          {categoryTree.length} دسته اصلی و {categoryTree.reduce((s, c) => s + c.children.length, 0)} زیردسته
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTree.map((parent) => {
            const Icon = (Icons as any)[parent.icon] ?? Icons.Package;
            return (
              <section
                key={parent.id}
                className="rounded-xl2 border border-line bg-white p-5 shadow-card"
              >
                <Link
                  href={`/categories/${parent.slug}`}
                  className="mb-4 flex items-center gap-3 hover:text-camel-600"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-ink-900">{parent.name}</span>
                    <span className="block text-xs text-ink-400">
                      {formatNumber(parent.rfqCount)} درخواست فعال
                    </span>
                  </span>
                </Link>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-xs text-ink-600 hover:text-camel-600"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
