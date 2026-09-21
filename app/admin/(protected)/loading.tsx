import { Loader2 } from "lucide-react";

// Specific to the admin (protected) section — keeps the sidebar-style
// layout shape while content loads, instead of a generic full-page
// spinner, so navigating between admin pages (users, categories,
// rfqs, violations...) doesn't feel like the whole app reset.
export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-camel-500">
      <Loader2 className="h-7 w-7 animate-spin" />
      <p className="text-xs font-bold text-ink-400">در حال بارگذاری...</p>
    </div>
  );
}
