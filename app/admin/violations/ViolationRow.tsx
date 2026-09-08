"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, AlertTriangle, Clock, Flag } from "lucide-react";
import { banSellerAction, dismissViolationAction } from "./actions";

const typeLabels: Record<string, string> = {
  suspicious_price: "قیمت مشکوک",
  no_delivery: "عدم تحویل (خودکار)",
  buyer_report: "گزارش خریدار"
};

const typeIcons: Record<string, any> = {
  suspicious_price: AlertTriangle,
  no_delivery: Clock,
  buyer_report: Flag
};

interface Violation {
  id: string;
  type: string;
  reason: string;
  resultingStrikeNumber?: number | null;
  createdAt: string;
  seller: { id: string; name: string; email: string; strikeCount: number; status: string } | null;
  rfq: { title: string; slug: string } | null;
}

export default function ViolationRow({ violation }: { violation: Violation }) {
  const [isPending, startTransition] = useTransition();
  const Icon = typeIcons[violation.type] ?? AlertTriangle;

  function handleBan() {
    if (!confirm(`فروشنده «${violation.seller?.name}» به‌طور دائم مسدود شود؟`)) return;
    const fd = new FormData();
    fd.set("violationId", violation.id);
    startTransition(async () => {
      try {
        await banSellerAction(fd);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  function handleDismiss() {
    const fd = new FormData();
    fd.set("violationId", violation.id);
    startTransition(async () => {
      try {
        await dismissViolationAction(fd);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <div className="rounded-xl2 border border-danger/20 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
              {violation.seller?.name ?? "کاربر حذف‌شده"}
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                {typeLabels[violation.type]}
              </span>
              {violation.resultingStrikeNumber && (
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">
                  اخطار {violation.resultingStrikeNumber}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-ink-500" dir="ltr">
              {violation.seller?.email}
            </p>
            <p className="mt-2 max-w-xl text-xs leading-6 text-ink-600">{violation.reason}</p>
            {violation.rfq && (
              <Link
                href={`/rfq/${violation.rfq.slug}`}
                target="_blank"
                className="mt-1 inline-block text-xs font-bold text-camel-600 hover:text-camel-700"
              >
                مشاهده درخواست: {violation.rfq.title}
              </Link>
            )}
            <p className="mt-2 text-[11px] text-ink-400">
              {new Date(violation.createdAt).toLocaleString("fa-IR")} · مجموع اخطارهای فروشنده:{" "}
              {violation.seller?.strikeCount ?? 0}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink-600 transition hover:border-success/40 hover:text-success disabled:opacity-40"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            رد گزارش
          </button>
          <button
            onClick={handleBan}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-2 text-xs font-bold text-white transition hover:bg-danger/90 disabled:opacity-40"
          >
            <Ban className="h-3.5 w-3.5" />
            بن دائم
          </button>
        </div>
      </div>
    </div>
  );
}
