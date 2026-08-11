export default function LoadingBookings() {
  return (
    <div className="space-y-5 animate-pulse p-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-6 w-10 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="h-20 w-full bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
