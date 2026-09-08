"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function SelectBidButton({ rfqId, bidId }: { rfqId: string; bidId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bidId })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "انتخاب فروشنده ناموفق بود");
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSelect}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg bg-camel-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-camel-600 disabled:opacity-60"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {isPending ? "در حال ثبت..." : "انتخاب این پیشنهاد"}
      </button>
      {error && <p className="text-[11px] font-bold text-danger">{error}</p>}
    </div>
  );
}
