"use client";

import { useTransition } from "react";
import { Ban } from "lucide-react";
import Link from "next/link";
import { cancelRfqAction } from "./actions";
import { formatNumber } from "@/lib/format";

const statusLabels: Record<string, string> = {
  active: "در حال مزایده",
  selecting: "در حال انتخاب",
  in_progress: "در حال انجام",
  completed: "پایان یافته",
  expired: "منقضی شده",
  cancelled: "لغو شده"
};

const statusStyles: Record<string, string> = {
  active: "bg-camel-50 text-camel-700",
  selecting: "bg-camel-50 text-camel-700",
  in_progress: "bg-success/10 text-success",
  completed: "bg-ink-50 text-ink-500",
  expired: "bg-danger/10 text-danger",
  cancelled: "bg-danger/10 text-danger"
};

interface Row {
  id: string;
  slug: string;
  title: string;
  buyer?: { name: string };
  categorySlug: string;
  province: string;
  status: string;
  bidsCount: number;
}

export default function AdminRfqRow({ rfq }: { rfq: Row }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm(`درخواست «${rfq.title}» لغو شود؟`)) return;
    const fd = new FormData();
    fd.set("id", rfq.id);
    startTransition(async () => {
      try {
        await cancelRfqAction(fd);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  const canCancel = rfq.status === "active" || rfq.status === "in_progress";

  return (
    <tr className="border-b border-line last:border-0 hover:bg-camel-50/40">
      <td className="px-4 py-3 font-bold text-ink-900">
        <Link href={`/rfq/${rfq.slug}`} target="_blank" className="hover:text-camel-600">
          {rfq.title}
        </Link>
      </td>
      <td className="px-4 py-3 text-ink-600">{rfq.buyer?.name ?? "—"}</td>
      <td className="px-4 py-3 text-ink-600">{rfq.categorySlug}</td>
      <td className="px-4 py-3 text-ink-600">{rfq.province}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[rfq.status]}`}>
          {statusLabels[rfq.status]}
        </span>
      </td>
      <td className="num px-4 py-3 text-ink-600">{formatNumber(rfq.bidsCount)}</td>
      <td className="px-4 py-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-ink-600 transition hover:border-danger/40 hover:text-danger disabled:opacity-40"
          >
            <Ban className="h-3 w-3" />
            لغو
          </button>
        )}
      </td>
    </tr>
  );
}
