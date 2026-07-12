import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 animate-pulse">
      {/* Quick Action Bar Shimmer */}
      <div className="h-14 bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-between px-4" />

      {/* 1. 5-Second Operational Strip Shimmer */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded-md" />
              <div className="h-7 w-7 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            <div className="h-3 w-28 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* 2. Quick Actions Shimmer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="h-24 bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <div className="h-8 w-8 rounded-xl bg-slate-100" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Main Content Grid Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="h-16 bg-slate-50 rounded-2xl border border-slate-100 p-3" />
            ))}
          </div>
        </div>

        <div className="h-[400px] bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-20 bg-slate-50 rounded-2xl p-3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
