"use client";

import { useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { switchRoleAction } from "./actions";

export default function SwitchRoleButton({
  currentRole
}: {
  currentRole: "buyer" | "seller";
}) {
  const [isPending, startTransition] = useTransition();
  const targetRole = currentRole === "buyer" ? "فروشنده" : "خریدار";

  function handleClick() {
    if (
      !confirm(
        `حساب شما به «${targetRole}» تغییر می‌کند. برای برگشتن به حالت قبل، هر وقت خواستید دوباره همین دکمه را بزنید. ادامه می‌دهید؟`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await switchRoleAction();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-camel-300 bg-camel-50 px-5 py-2.5 text-sm font-bold text-camel-700 transition hover:bg-camel-100 disabled:opacity-60"
    >
      <ArrowLeftRight className="h-4 w-4" />
      {isPending ? "در حال تغییر..." : `تغییر به ${targetRole}`}
    </button>
  );
}
