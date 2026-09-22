import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import type { PublicUser } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { computeTrustScore } from "@/lib/trust-score";

const medalStyle = [
  "bg-gold text-white",
  "bg-ink-400 text-white",
  "bg-camel-400 text-white"
];

export default function TopSellers({
  sellers,
  dealsLabel = "معامله موفق",
  href = "/sellers",
  // Sellers have real star reviews (components/RatingForm.tsx), so
  // showing the raw star rating is the more meaningful, honest number
  // for them. Buyers aren't rated by anyone yet, so a "0.0 ★" badge
  // would look broken/misleading — showing the computed trust score
  // (lib/trust-score.ts, driven by their purchase volume) instead is
  // an accurate stand-in until a seller -> buyer rating flow exists.
  scoreDisplay = "rating"
}: {
  sellers: PublicUser[];
  dealsLabel?: string;
  href?: string;
  scoreDisplay?: "rating" | "trust";
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {sellers.map((seller, i) => (
        <Link
          key={seller.id}
          href={href}
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
          {scoreDisplay === "rating" ? (
            <p className="flex items-center gap-1 text-sm font-bold text-gold">
              {seller.rating.toFixed(1)}
              <Star className="h-4 w-4 fill-gold text-gold" />
            </p>
          ) : (
            <p className="text-sm font-bold text-camel-600">
              امتیاز اعتبار: {computeTrustScore(seller)}
            </p>
          )}
          <p className="text-xs text-ink-400">
            {formatNumber(seller.dealsCompleted)} {dealsLabel}
          </p>
        </Link>
      ))}
    </div>
  );
}
