import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getPendingViolations } from "@/lib/queries";
import { sweepOverdueDeliveries } from "@/lib/violations";
import ViolationRow from "./ViolationRow";

export const metadata: Metadata = { title: "پرونده‌های تخلف | ادمین", robots: { index: false } };
export const revalidate = 0;

export default async function AdminViolationsPage() {
  // Opportunistic sweep: catches sellers who won a bid and never
  // confirmed delivery, even if nobody happened to open that RFQ's page.
  await sweepOverdueDeliveries().catch((err) => console.error("sweepOverdueDeliveries failed:", err));

  const violations = await getPendingViolations();

  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-danger" />
        <h1 className="text-xl font-extrabold text-ink-900">
          پرونده‌های تخلف در انتظار بررسی ({violations.length})
        </h1>
      </div>
      <p className="mb-6 text-sm text-ink-500">
        این‌ها یا فروشندگانی هستند که به اخطار سوم رسیده‌اند (بن دائم نیازمند
        تایید شماست)، یا گزارش‌های خریداران درباره‌ی عدم تحویل کالا.
      </p>

      <div className="space-y-3">
        {violations.map((v) => (
          <ViolationRow key={v.id} violation={v as any} />
        ))}
        {violations.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
            هیچ پرونده‌ی در انتظار بررسی وجود ندارد.
          </p>
        )}
      </div>
    </>
  );
}
