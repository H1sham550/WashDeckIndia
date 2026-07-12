import React from "react";
import { Loader2 } from "lucide-react";

export default function JobDetailsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-pulse">
      {/* Top Bar Shimmer */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      {/* Main Card Shimmer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-slate-200 rounded-xl" />
            <div className="h-4 w-32 bg-slate-100 rounded-md" />
          </div>
          <div className="h-8 w-28 bg-slate-100 rounded-full" />
        </div>

        {/* Services List Shimmer */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-16 bg-slate-50 rounded-2xl border p-4 flex justify-between items-center">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Photos Section Shimmer */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="h-28 bg-slate-100 rounded-2xl border" />
            ))}
          </div>
        </div>

        {/* Action Buttons Shimmer */}
        <div className="pt-6 border-t border-slate-100 flex gap-3">
          <div className="h-12 flex-1 bg-slate-200 rounded-2xl" />
          <div className="h-12 w-36 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
