"use client";

import { useTransition } from "react";
import { ShieldCheck, ShieldX, Lock, Unlock, AlertTriangle, Clock } from "lucide-react";
import { toggleVerifiedAction, toggleStatusAction } from "./actions";

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  city?: string;
  rating: number;
  verified: boolean;
  status: "active" | "suspended";
  effectiveStatus: "active" | "suspended";
  isTempSuspension: boolean;
  strikeCount?: number;
  banReviewPending?: boolean;
  tempSuspendedUntil?: string | null;
}

const roleLabels: Record<string, string> = { buyer: "خریدار", seller: "فروشنده", admin: "ادمین" };

export default function UserRow({ user }: { user: Row }) {
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    const fd = new FormData();
    fd.set("id", user.id);
    startTransition(async () => {
      try {
        await toggleVerifiedAction(fd);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  function handleStatus() {
    if (user.effectiveStatus === "active" && !confirm(`کاربر «${user.name}» مسدود شود؟`)) return;
    const fd = new FormData();
    fd.set("id", user.id);
    startTransition(async () => {
      try {
        await toggleStatusAction(fd);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <tr className="border-b border-line last:border-0 hover:bg-camel-50/40">
      <td className="px-4 py-3 font-bold text-ink-900">
        <span className="flex items-center gap-1.5">
          {user.name}
          {user.verified ? (
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
          ) : (
            <ShieldX className="h-3.5 w-3.5 text-ink-300" />
          )}
        </span>
      </td>
      <td className="px-4 py-3 text-ink-500" dir="ltr">
        {user.email}
      </td>
      <td className="px-4 py-3 text-ink-600">{roleLabels[user.role]}</td>
      <td className="px-4 py-3 text-ink-600">{user.city || "—"}</td>
      <td className="num px-4 py-3 text-ink-600">{user.rating.toFixed(1)}</td>
      <td className="px-4 py-3">
        {user.role === "seller" ? (
          <span className="flex flex-wrap items-center gap-1">
            {(user.strikeCount ?? 0) > 0 && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  (user.strikeCount ?? 0) >= 3 ? "bg-danger/10 text-danger" : "bg-gold/10 text-gold"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                {user.strikeCount}
              </span>
            )}
            {user.banReviewPending && (
              <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                در انتظار بررسی
              </span>
            )}
            {(user.strikeCount ?? 0) === 0 && !user.banReviewPending && "—"}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            user.effectiveStatus === "active" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}
        >
          {user.effectiveStatus === "suspended" && user.isTempSuspension && <Clock className="h-3 w-3" />}
          {user.effectiveStatus === "active"
            ? "فعال"
            : user.isTempSuspension
              ? "تعلیق موقت"
              : "مسدود"}
        </span>
        {user.isTempSuspension && user.tempSuspendedUntil && (
          <span className="mt-0.5 block text-[10px] text-ink-400">
            تا {new Date(user.tempSuspendedUntil).toLocaleDateString("fa-IR")}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleVerify}
            disabled={isPending || user.role === "admin"}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-ink-600 transition hover:border-camel-300 hover:text-camel-600 disabled:opacity-40"
            title={user.verified ? "لغو تایید" : "تایید هویت"}
          >
            {user.verified ? "لغو تایید" : "تایید"}
          </button>
          <button
            onClick={handleStatus}
            disabled={isPending || user.role === "admin"}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
              user.effectiveStatus === "active"
                ? "border-line text-ink-600 hover:border-danger/40 hover:text-danger"
                : "border-success/40 text-success hover:bg-success/5"
            }`}
          >
            {user.effectiveStatus === "active" ? (
              <>
                <Lock className="h-3 w-3" /> مسدود کن
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3" /> رفع مسدودی
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
