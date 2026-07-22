"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StationOption {
  id: string;
  name: string;
  slug: string;
}

interface StationSelectorProps {
  currentStation: StationOption;
  userStations?: StationOption[];
}

export function StationSelector({
  currentStation,
  userStations = [],
}: StationSelectorProps) {
  const [open, setOpen] = useState(false);

  // If user only has 1 station and no options, just show static pill
  if (userStations.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-xs min-w-0">
        <Building2 size={14} className="text-blue-600 flex-shrink-0" />
        <span className="truncate max-w-[95px] min-[380px]:max-w-[130px] sm:max-w-[200px]">{currentStation.name}</span>
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-xs transition-colors active-tap min-w-0"
      >
        <Building2 size={14} className="text-blue-600 flex-shrink-0" />
        <span className="truncate max-w-[95px] min-[380px]:max-w-[130px] sm:max-w-[200px]">{currentStation.name}</span>
        <ChevronDown
          size={14}
          className={cn("text-slate-400 transition-transform flex-shrink-0", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-slide-up">
            <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
              Switch Station Location
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {userStations.map((st) => {
                const isCurrent = st.id === currentStation.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setOpen(false);
                      if (!isCurrent) {
                        window.location.href = `/api/auth/switch-station?stationId=${st.id}`;
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors",
                      isCurrent
                        ? "bg-blue-50 text-blue-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate">{st.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{st.slug}</p>
                    </div>
                    {isCurrent && <Check size={14} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
