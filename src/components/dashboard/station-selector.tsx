"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
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

  // If user only has 1 station, hide selector to avoid duplicating shop name in header
  if (userStations.length <= 1) {
    return null;
  }

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
        title="Switch station location"
      >
        <Building2 size={14} className="text-white/80 shrink-0" />
        <span className="truncate text-[11px] sm:text-xs">Switch Location</span>
        <ChevronDown
          size={14}
          className={cn("text-white/70 transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
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
                    {isCurrent && <Check size={14} className="text-blue-600 shrink-0" />}
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
