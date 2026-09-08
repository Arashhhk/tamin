"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

export default function BidForm({ rfqId }: { rfqId: string }) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/bids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: Number(price), note })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "ثبت پیشنهاد ناموفق بود");
        }
        setSubmitted(true);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl2 border border-success/30 bg-success/5 p-4 text-sm font-bold text-success">
        <CheckCircle2 className="h-5 w-5" />
        پیشنهاد شما با موفقیت ثبت شد.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl2 border border-line bg-white p-4">
      <div>
        <label htmlFor="bid-price" className="mb-1.5 block text-xs font-bold text-ink-800">
          قیمت پیشنهادی (تومان)
        </label>
        <input
          id="bid-price"
          type="number"
          min={1}
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>
      <div>
        <label htmlFor="bid-note" className="mb-1.5 block text-xs font-bold text-ink-800">
          توضیح (اختیاری)
        </label>
        <textarea
          id="bid-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
        />
      </div>
      {error && <p className="text-xs font-bold text-danger">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-camel-500 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600 disabled:opacity-60"
      >
        {isPending ? "در حال ثبت..." : "ثبت پیشنهاد"}
      </button>
    </form>
  );
}
