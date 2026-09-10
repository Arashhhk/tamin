import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getCategoryBySlug, getActiveRfqs } from "@/lib/queries";
import { connectToDatabase } from "@/lib/mongodb";
import Rfq from "@/models/Rfq";
import Category from "@/models/Category";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: "دسته‌بندی یافت نشد" };
  return {
    title: `${cat.name} | درخواست‌های خرید و مزایده`,
    description: `درخواست‌های خرید فعال در دسته ${cat.name} روی تامین. فروشندگان می‌توانند قیمت پیشنهاد دهند.`,
    alternates: { canonical: `/categories/${cat.slug}` }
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { province?: string };
}) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  await connectToDatabase();

  // Province filter should reflect only RFQs actually reachable from this
  // category (itself + children if it's a parent).
  let categoryIds: string[] = [cat.id];
  if (cat.isParent) {
    const childDocs = await Category.find({ parent: cat.id }).distinct("_id");
    categoryIds = [cat.id, ...childDocs.map(String)];
  }
  const provinces: string[] = await Rfq.find({
    status: "active",
    category: { $in: categoryIds }
  }).distinct("province");

  const filtered = await getActiveRfqs({
    categorySlug: cat.slug,
    province: searchParams.province,
    limit: 200
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav aria-label="مسیر صفحه" className="mb-3 text-xs text-ink-400">
          <Link href="/categories" className="hover:text-camel-600">
            دسته‌بندی‌ها
          </Link>
          {cat.parent && (
            <>
              <span className="mx-1.5">/</span>
              <Link href={`/categories/${cat.parent.slug}`} className="hover:text-camel-600">
                {cat.parent.name}
              </Link>
            </>
          )}
          <span className="mx-1.5">/</span>
          <span className="text-ink-600">{cat.name}</span>
        </nav>

        <h1 className="mb-2 flex items-center gap-2 text-xl font-extrabold text-ink-900">
          {(() => {
            const Icon = (Icons as any)[cat.icon] ?? Icons.Package;
            return (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
                <Icon className="h-4.5 w-4.5" />
              </span>
            );
          })()}
          {cat.name}
        </h1>
        <p className="mb-6 text-sm text-ink-500">
          {filtered.length} درخواست خرید فعال در این دسته
        </p>

        {cat.isParent && cat.children.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {cat.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:border-camel-300 hover:text-camel-600"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {provinces.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <a
              href={`/categories/${cat.slug}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${!searchParams.province ? "border-camel-500 bg-camel-500 text-white" : "border-line text-ink-600 hover:border-camel-300"}`}
            >
              همه استان‌ها
            </a>
            {provinces.map((p) => (
              <a
                key={p}
                href={`/categories/${cat.slug}?province=${encodeURIComponent(p)}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${searchParams.province === p ? "border-camel-500 bg-camel-500 text-white" : "border-line text-ink-600 hover:border-camel-300"}`}
              >
                {p}
              </a>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              در حال حاضر درخواست فعالی در این فیلتر وجود ندارد.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
