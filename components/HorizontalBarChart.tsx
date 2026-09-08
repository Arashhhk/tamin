import { formatNumber } from "@/lib/format";

export default function HorizontalBarChart({
  data,
  colorClass = "bg-camel-500"
}: {
  data: { label: string; count: number }[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-ink-400">داده‌ای برای نمایش وجود ندارد.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-bold text-ink-700">{d.label}</span>
            <span className="num font-bold text-ink-500">{formatNumber(d.count)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-50">
            <div
              className={`h-full rounded-full ${colorClass}`}
              style={{ width: `${Math.max(4, (d.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
