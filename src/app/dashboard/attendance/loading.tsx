export default function LoadingAttendance() {
  return (
    <div className="space-y-5 animate-pulse p-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 bg-slate-200 rounded-lg" />
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-7 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
