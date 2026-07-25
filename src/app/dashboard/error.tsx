"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle size={28} />
      </div>
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Something went wrong</h2>
      <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
        An unexpected error occurred while loading this dashboard module. You can try refreshing the section or contact support.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
      >
        <RotateCcw size={14} />
        <span>Try Again</span>
      </button>
    </div>
  );
}
