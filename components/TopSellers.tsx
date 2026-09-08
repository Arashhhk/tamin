import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import type { PublicUser } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const medalStyle = [
  "bg-gold text-white",
  "bg-ink-400 text-white",
  "bg-camel-400 text-white"
];

export default function TopSellers({ sellers }: { sellers: PublicUser[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {sellers.map((seller, i) => (
        <Link
          key={seller.id}
          href="/sellers"
          className="relative flex flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-6 text-center shadow-card transition hover:-translate-y-0.5 hover:border-camel-300"
        >
          <span
            className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${medalStyle[i] ?? "bg-ink-100 text-ink-600"}`}
          >
            {i + 1}
          </span>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-camel-100 text-xl font-extrabold text-camel-700">
            {seller.name.slice(0, 1)}
          </span>
          <p className="flex items-center gap-1.5 font-extrabold text-ink-900">
            {seller.name}
            {seller.verified && <ShieldCheck className="h-4 w-4 text-success" />}
          </p>
          <p className="flex items-center gap-1 text-sm font-bold text-gold">
            {seller.rating.toFixed(1)}
            <Star className="h-4 w-4 fill-gold text-gold" />
          </p>
          <p className="text-xs text-ink-400">{formatNumber(seller.dealsCompleted)} معامله موفق</p>
        </Link>
      ))}
    </div>
  );
}
