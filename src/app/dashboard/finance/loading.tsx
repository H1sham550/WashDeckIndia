export default function LoadingFinance() {
  return (
    <div className="space-y-5 animate-pulse p-4 max-w-6xl">
      <div className="space-y-1">
        <div className="h-7 w-52 bg-slate-200 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="p-5 rounded-2xl bg-slate-900 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-slate-700 rounded" />
          <div className="h-8 w-24 bg-slate-700 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
