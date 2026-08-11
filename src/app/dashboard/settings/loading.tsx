export default function LoadingSettings() {
  return (
    <div className="space-y-6 animate-pulse p-4 max-w-4xl">
      <div className="h-7 w-32 bg-slate-200 rounded-lg" />
      <div className="space-y-4">
        {[1,2,3].map((section) => (
          <div key={section} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded border-b pb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map((field) => (
                <div key={field} className="space-y-1">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-10 w-full bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-11 w-32 bg-slate-200 rounded-xl" />
    </div>
  );
}
