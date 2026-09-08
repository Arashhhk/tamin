export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-6 sm:px-6">
      <div className="mb-6 h-40 rounded-xl2 bg-camel-100" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_300px]">
        <div className="space-y-4">
          <div className="h-48 rounded-xl2 bg-ink-50" />
          <div className="h-40 rounded-xl2 bg-ink-50" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl2 bg-ink-50" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-xl2 bg-ink-50" />
        </div>
      </div>
    </div>
  );
}
