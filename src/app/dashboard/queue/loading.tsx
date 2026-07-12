import React from "react";
import { Loader2 } from "lucide-react";

export default function QueueLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 space-y-6 animate-pulse">
      {/* Header Shimmer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="h-11 w-44 bg-slate-200 rounded-2xl" />
      </div>

      {/* Kanban Columns Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          "Received & Waiting",
          "In Progress",
          "Ready for Inspection",
          "Payment Pending",
          "Completed Today",
        ].map((title, idx) => (
          <div
            key={idx}
            className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-4 min-h-[500px] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-xs font-black text-slate-500 uppercase">{title}</span>
              <div className="h-5 w-6 bg-slate-200 rounded-full" />
            </div>

            <div className="space-y-3">
              {[1, 2].map((cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-24 bg-slate-200 rounded-md" />
                    <div className="h-5 w-12 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                    <div className="h-6 w-20 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
