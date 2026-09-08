import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategoryTree } from "@/lib/queries";
import { createRfq } from "./actions";

export const metadata: Metadata = {
  title: "ثبت درخواست خرید",
  description: "درخواست خرید خود را ثبت کنید تا فروشندگان برایتان قیمت پیشنهاد دهند.",
  alternates: { canonical: "/rfq/new" },
  robots: { index: false, follow: true } // form pages don't need indexing
};

const provinces = [
  "تهران", "اصفهان", "فارس", "خراسان رضوی", "آذربایجان شرقی",
  "خوزستان", "کرمان", "گیلان", "مازندران", "البرز"
];

export default async function NewRfqPage() {
  const categoryTree = await getCategoryTree();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-xl font-extrabold text-ink-900">ثبت درخواست خرید</h1>
        <p className="mb-6 text-sm text-ink-500">
          هرچه اطلاعات دقیق‌تر باشد، پیشنهادهای بهتری دریافت می‌کنید.
        </p>

        <form action={createRfq} className="space-y-5 rounded-xl2 border border-line bg-white p-6 shadow-card">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-ink-800">
              عنوان درخواست
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="مثلاً: ورق استیل ۳۰۴ مواد اولیه"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-bold text-ink-800">
              توضیحات
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="مشخصات فنی، استاندارد مورد نیاز، بازه زمانی تحویل و..."
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-bold text-ink-800">
                دسته‌بندی
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              >
                <option value="">انتخاب کنید</option>
                {categoryTree.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.slug}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-sm font-bold text-ink-800">
                مهلت مزایده
              </label>
              <select
                id="duration"
                name="duration"
                defaultValue="24"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              >
                <option value="6">۶ ساعت</option>
                <option value="24">۱ روز</option>
                <option value="72">۳ روز</option>
                <option value="168">۱ هفته</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="mb-1.5 block text-sm font-bold text-ink-800">
                مقدار
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              />
            </div>
            <div>
              <label htmlFor="unit" className="mb-1.5 block text-sm font-bold text-ink-800">
                واحد
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                placeholder="کیلوگرم، متر، دستگاه، تن..."
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="province" className="mb-1.5 block text-sm font-bold text-ink-800">
                استان
              </label>
              <select
                id="province"
                name="province"
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              >
                <option value="">انتخاب کنید</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-bold text-ink-800">
                شهر
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white shadow-pop transition hover:bg-camel-600"
          >
            ثبت درخواست
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
