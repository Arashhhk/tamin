import type { Metadata } from "next";
import { MessageSquarePlus } from "lucide-react";
import { getSuggestions } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import SuggestionRow from "./SuggestionRow";

export const metadata: Metadata = { title: "پیشنهادات کاربران | ادمین", robots: { index: false } };
export const revalidate = 0;

export default async function AdminSuggestionsPage() {
  const suggestions = await getSuggestions();
  const unreadCount = suggestions.filter((s) => s.status === "new").length;

  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-camel-600" />
        <h1 className="text-xl font-extrabold text-ink-900">
          پیشنهادات و انتقادات کاربران ({formatNumber(suggestions.length)})
        </h1>
      </div>
      <p className="mb-6 text-sm text-ink-500">
        {unreadCount > 0 ? `${formatNumber(unreadCount)} پیام خوانده‌نشده` : "همه‌ی پیام‌ها خوانده شده‌اند"}
      </p>

      <div className="space-y-3">
        {suggestions.map((s) => (
          <SuggestionRow key={s.id} suggestion={s as any} />
        ))}
        {suggestions.length === 0 && (
          <p className="rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
            هنوز هیچ پیشنهادی ثبت نشده است.
          </p>
        )}
      </div>
    </>
  );
}
