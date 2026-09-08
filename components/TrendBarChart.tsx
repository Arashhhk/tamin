export default function TrendBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-40 items-end gap-1.5 overflow-x-auto">
      {data.map((d, i) => (
        <div key={i} className="flex min-w-[20px] flex-1 flex-col items-center gap-1.5">
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-t-md bg-camel-500 transition-all"
              style={{ height: `${d.count === 0 ? 2 : Math.max(6, (d.count / max) * 100)}%` }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
          <span className="whitespace-nowrap text-[10px] text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
