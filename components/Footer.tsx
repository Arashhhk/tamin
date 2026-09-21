import Link from "next/link";
import { Gavel } from "lucide-react";
import { getCategoryTree } from "@/lib/queries";

export default async function Footer() {
  const categoryTree = await getCategoryTree();

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2 text-ink-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-camel-500 text-white">
                <Gavel className="h-4 w-4" />
              </span>
              <span className="font-extrabold">پله</span>
            </Link>
            <p className="text-xs leading-6 text-ink-500">
              پلتفرم مزایده معکوس برای خرید و تأمین کالا و خدمات در سراسر
              ایران.
            </p>
          </div>

          <nav aria-label="درباره پله">
            <h3 className="mb-3 text-sm font-extrabold text-ink-900">درباره پله</h3>
            <ul className="space-y-2 text-xs text-ink-500">
              <li>
                <Link href="/how-it-works" className="hover:text-camel-600">
                  پله چطور کار می‌کند
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-camel-600">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="hover:text-camel-600">
                  فروشندگان برتر
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-camel-600">
                  مجله پله
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="پشتیبانی و قوانین">
            <h3 className="mb-3 text-sm font-extrabold text-ink-900">پشتیبانی</h3>
            <ul className="space-y-2 text-xs text-ink-500">
              <li>
                <Link href="/contact" className="hover:text-camel-600">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-camel-600">
                  سوالات متداول
                </Link>
              </li>
              <li>
                <Link href="/suggestions" className="hover:text-camel-600">
                  پیشنهادات و انتقادات
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-camel-600">
                  قوانین و مقررات
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-camel-600">
                  حریم خصوصی
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="حساب کاربری">
            <h3 className="mb-3 text-sm font-extrabold text-ink-900">حساب کاربری</h3>
            <ul className="space-y-2 text-xs text-ink-500">
              <li>
                <Link href="/login" className="hover:text-camel-600">
                  ورود
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-camel-600">
                  ثبت‌نام
                </Link>
              </li>
              <li>
                <Link href="/rfq/new" className="hover:text-camel-600">
                  ثبت درخواست خرید
                </Link>
              </li>
              <li>
                <Link href="/seller" className="hover:text-camel-600">
                  ورود به داشبورد فروشنده
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Full category directory — grouped by parent, standard marketplace footer pattern */}
        <div className="mt-10 border-t border-line pt-8">
          <h3 className="mb-5 text-sm font-extrabold text-ink-900">دسته‌بندی‌ها</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {categoryTree.map((parent) => (
              <div key={parent.id}>
                <Link
                  href={`/categories/${parent.slug}`}
                  className="mb-2 block text-xs font-extrabold text-ink-800 hover:text-camel-600"
                >
                  {parent.name}
                </Link>
                <ul className="space-y-1.5">
                  {parent.children.slice(0, 6).map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-xs text-ink-500 hover:text-camel-600"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} پله. تمامی حقوق محفوظ است.</p>
          <p>ساخته‌شده برای تأمین صنعتی و تجاری ایران</p>
        </div>
      </div>
    </footer>
  );
}
