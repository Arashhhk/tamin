"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, CheckCircle2, Clock, Flag } from "lucide-react";

export default function DeliveryConfirmPanel({
  rfqId,
  buyerConfirmed,
  sellerConfirmed,
  completed,
  viewerRole
}: {
  rfqId: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  completed: boolean;
  viewerRole: "buyer" | "seller";
}) {
  const [error, setError] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isReporting, startReportTransition] = useTransition();
  const router = useRouter();

  const myConfirmed = viewerRole === "buyer" ? buyerConfirmed : sellerConfirmed;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/delivery`, { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "ثبت تایید ناموفق بود");
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function handleReport() {
    if (!confirm("گزارش می‌دهید که فروشنده کالا را تحویل نداده است؟ این پرونده برای بررسی نزد مدیریت ارسال می‌شود.")) return;
    setError(null);
    startReportTransition(async () => {
      try {
        const res = await fetch(`/api/rfq/${rfqId}/report`, { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "ثبت گزارش ناموفق بود");
        }
        setReportSent(true);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="rounded-xl2 border border-line bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink-900">
        <PackageCheck className="h-4 w-4 text-camel-500" />
        تایید تحویل کالا
      </h3>

      <ul className="mb-3 space-y-2 text-xs">
        <li className="flex items-center gap-2">
          {buyerConfirmed ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Clock className="h-4 w-4 text-ink-300" />
          )}
          تایید خریدار: {buyerConfirmed ? "انجام شد" : "در انتظار"}
        </li>
        <li className="flex items-center gap-2">
          {sellerConfirmed ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Clock className="h-4 w-4 text-ink-300" />
          )}
          تایید فروشنده: {sellerConfirmed ? "انجام شد" : "در انتظار"}
        </li>
      </ul>

      {completed ? (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-bold text-success">
          معامله با تایید هر دو طرف تکمیل شد.
        </p>
      ) : myConfirmed ? (
        <p className="rounded-lg bg-camel-50 px-3 py-2 text-xs font-bold text-camel-700">
          شما تحویل را تایید کردید؛ منتظر تایید طرف مقابل هستیم.
        </p>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full rounded-lg bg-camel-500 py-2.5 text-xs font-bold text-white transition hover:bg-camel-600 disabled:opacity-60"
        >
          {isPending ? "در حال ثبت..." : "تایید دریافت/تحویل کالا"}
        </button>
      )}

      {viewerRole === "buyer" && !completed && !sellerConfirmed && (
        <div className="mt-3 border-t border-line pt-3">
          {reportSent ? (
            <p className="rounded-lg bg-camel-50 px-3 py-2 text-xs font-bold text-camel-700">
              گزارش شما ثبت شد و توسط مدیریت بررسی می‌شود.
            </p>
          ) : (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger/30 py-2 text-xs font-bold text-danger transition hover:bg-danger/5 disabled:opacity-60"
            >
              <Flag className="h-3.5 w-3.5" />
              {isReporting ? "در حال ارسال..." : "گزارش عدم تحویل فروشنده"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[11px] font-bold text-danger">{error}</p>}
    </div>
  );
}
