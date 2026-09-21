import { Loader2 } from "lucide-react";

// Shown by Next.js automatically during any server-navigation on a
// route segment that doesn't have its own more specific loading.tsx —
// gives immediate visual feedback ("something is happening") instead
// of the page appearing to freeze while the next page's data loads.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-camel-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-xs font-bold text-ink-400">در حال بارگذاری...</p>
    </div>
  );
}
