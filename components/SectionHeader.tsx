import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "مشاهده همه",
  light = false
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2
          className={`text-xl font-extrabold sm:text-2xl ${light ? "text-white" : "text-ink-900"}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-1 text-sm ${light ? "text-white/80" : "text-ink-500"}`}>{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className={`flex items-center gap-1 text-sm font-bold transition ${
            light ? "text-white hover:text-white/80" : "text-camel-600 hover:text-camel-700"
          }`}
        >
          {hrefLabel}
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
