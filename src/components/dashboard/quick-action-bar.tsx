"use client";

import React from "react";
import Link from "next/link";
import { Plus, Car, UserPlus, FileSpreadsheet, Sparkles } from "lucide-react";

interface QuickActionBarProps {
  canManageStaff?: boolean;
}

export function QuickActionBar({ canManageStaff = false }: QuickActionBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-slate-800">Quick Operations Hub</h3>
          <p className="text-[10px] text-slate-400 font-medium">Instant action shortcuts for today's workflow</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Link
          href="/dashboard/queue?action=new"
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all active-tap"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Job Card</span>
        </Link>

        <Link
          href="/dashboard/vehicles"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors active-tap"
        >
          <Car size={14} className="text-slate-500" />
          <span className="hidden sm:inline">Add Vehicle</span>
        </Link>

        <Link
          href={"/dashboard/reports" as any}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors active-tap"
        >
          <FileSpreadsheet size={14} className="text-slate-500" />
          <span className="hidden sm:inline">Reports</span>
        </Link>
      </div>
    </div>
  );
}
