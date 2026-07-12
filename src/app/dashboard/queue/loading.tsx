export default function QueueLoading() {
  return (
    <div className="space-y-4 max-w-[1600px] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-3.5 w-32" />
        </div>
        <div className="skeleton h-9 w-24 rounded" />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="wd-card overflow-hidden" style={{ minHeight: 200 }}>
            <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ background: "hsl(var(--bg-subtle))" }}>
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="p-3 space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
