import Link from "next/link";
import * as Icons from "lucide-react";
import { formatNumber } from "@/lib/format";

interface ParentCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  rfqCount: number;
}

export default function CategoryGrid({ categories }: { categories: ParentCategory[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((cat) => {
        const Icon = (Icons as any)[cat.icon] ?? Icons.Package;
        return (
          <li key={cat.id}>
            <Link
              href={`/categories/${cat.slug}`}
              className="flex h-full flex-col items-center gap-2.5 rounded-xl2 border border-line bg-white px-3 py-5 text-center transition hover:-translate-y-0.5 hover:border-camel-300 hover:shadow-card"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel-50 text-camel-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-ink-800">{cat.name}</span>
              <span className="text-[11px] text-ink-400">
                {formatNumber(cat.rfqCount)} درخواست
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
