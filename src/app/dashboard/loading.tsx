export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-[1400px] animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-3.5 w-32" />
        </div>
        <div className="skeleton h-9 w-24 rounded" />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="wd-card p-4 space-y-3">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-7 w-14" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="wd-card h-16" />
          <div className="wd-card h-64" />
        </div>
        <div className="space-y-3">
          <div className="wd-card h-48" />
          <div className="wd-card h-40" />
        </div>
      </div>
    </div>
  );
}
