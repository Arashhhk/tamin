"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function RatingForm({ rfqId }: { rfqId: string }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (stars < 1) {
      setError("لطفاً یک امتیاز بین ۱ تا ۵ ستاره انتخاب کنید");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stars, comment })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "ثبت امتیاز ناموفق بود");
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="rounded-xl2 border border-line bg-white p-4">
      <h3 className="mb-3 text-sm font-extrabold text-ink-900">امتیاز به فروشنده</h3>
      <div className="mb-3 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHovered(n)}
            className="p-0.5"
            aria-label={`${n} ستاره`}
          >
            <Star
              className={`h-6 w-6 ${
                (hovered || stars) >= n ? "fill-camel-500 text-camel-500" : "text-ink-200"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="نظر شما درباره‌ی همکاری با این فروشنده (اختیاری)"
        className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-xs focus:border-camel-400"
      />
      <button
        onClick={submit}
        disabled={isPending}
        className="w-full rounded-lg bg-camel-500 py-2.5 text-xs font-bold text-white transition hover:bg-camel-600 disabled:opacity-60"
      >
        {isPending ? "در حال ثبت..." : "ثبت امتیاز"}
      </button>
      {error && <p className="mt-2 text-[11px] font-bold text-danger">{error}</p>}
    </div>
  );
}
