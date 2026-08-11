export default function LoadingVehicles() {
  return (
    <div className="space-y-5 animate-pulse p-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-11 w-full bg-slate-100 rounded-xl" />
      <div className="space-y-2">
        {[1,2,3,4,5,6,7,8].map((i) => (
          <div key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
