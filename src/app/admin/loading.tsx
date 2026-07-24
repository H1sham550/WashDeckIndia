export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      {/* Admin KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Main Admin Table / Content Skeleton */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-4">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 6].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
