"use client";

import React from "react";
import { VehicleType } from "@prisma/client";
import { Info } from "lucide-react";

export interface VehicleTypeOption {
  type: VehicleType;
  label: string;
  arabicLabel: string;
  description: string;
  doors: string;
  badge: string;
  svgIcon: React.ReactNode;
}

export const VEHICLE_TYPES_DATA: VehicleTypeOption[] = [
  {
    type: "SEDAN" as VehicleType,
    label: "Sedan",
    arabicLabel: "سيدان",
    description: "4-door passenger car with a separate rear trunk.",
    doors: "4 Doors",
    badge: "Standard",
    svgIcon: (
      <svg viewBox="0 0 100 48" className="w-full h-full stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Sedan Silhouette */}
        <path d="M 8 28 L 22 28 L 32 16 L 66 16 L 78 28 L 92 28 C 94 28 96 30 96 32 L 96 36 L 4 36 L 4 32 C 4 30 6 28 8 28 Z" />
        <path d="M 33 17 L 49 17 L 49 28 L 24 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <path d="M 52 17 L 65 17 L 75 28 L 52 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <circle cx="24" cy="36" r="6" className="fill-slate-800 stroke-slate-900" />
        <circle cx="24" cy="36" r="2.5" className="fill-white" />
        <circle cx="76" cy="36" r="6" className="fill-slate-800 stroke-slate-900" />
        <circle cx="76" cy="36" r="2.5" className="fill-white" />
      </svg>
    ),
  },
  {
    type: "SUV" as VehicleType,
    label: "SUV / Crossover",
    arabicLabel: "دفع رباعي / SUV",
    description: "High roofline, large frame, 5-7 seats, high ground clearance.",
    doors: "5 Doors",
    badge: "Large",
    svgIcon: (
      <svg viewBox="0 0 100 48" className="w-full h-full stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* SUV Silhouette */}
        <path d="M 6 30 L 16 30 L 26 12 L 80 12 L 90 24 L 94 28 C 96 29 96 31 96 33 L 96 36 L 4 36 L 4 32 C 4 30 5 30 6 30 Z" />
        <path d="M 28 14 L 49 14 L 49 28 L 20 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <path d="M 52 14 L 76 14 L 84 28 L 52 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <circle cx="22" cy="36" r="6.5" className="fill-slate-800 stroke-slate-900" />
        <circle cx="22" cy="36" r="2.5" className="fill-white" />
        <circle cx="76" cy="36" r="6.5" className="fill-slate-800 stroke-slate-900" />
        <circle cx="76" cy="36" r="2.5" className="fill-white" />
      </svg>
    ),
  },
  {
    type: "HATCHBACK" as VehicleType,
    label: "Hatchback",
    arabicLabel: "هاتشباك",
    description: "Compact 2-box body with upward opening rear door.",
    doors: "3-5 Doors",
    badge: "Compact",
    svgIcon: (
      <svg viewBox="0 0 100 48" className="w-full h-full stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Hatchback Silhouette */}
        <path d="M 8 28 L 22 28 L 34 16 L 70 16 L 82 24 L 88 28 L 92 28 C 94 28 96 30 96 32 L 96 36 L 4 36 L 4 32 C 4 30 6 28 8 28 Z" />
        <path d="M 35 18 L 50 18 L 50 28 L 24 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <path d="M 53 18 L 68 18 L 78 28 L 53 28 Z" className="fill-blue-500/15 stroke-current" strokeWidth="1.5" />
        <circle cx="24" cy="36" r="5.5" className="fill-slate-800 stroke-slate-900" />
        <circle cx="24" cy="36" r="2" className="fill-white" />
        <circle cx="74" cy="36" r="5.5" className="fill-slate-800 stroke-slate-900" />
        <circle cx="74" cy="36" r="2" className="fill-white" />
      </svg>
    ),
  },
  {
    type: "BIKE" as VehicleType,
    label: "Motorcycle / Bike",
    arabicLabel: "دراجة نارية",
    description: "2-wheeler scooter, sports bike, or motorcycle.",
    doors: "N/A",
    badge: "2-Wheel",
    svgIcon: (
      <svg viewBox="0 0 100 48" className="w-full h-full stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Motorcycle Silhouette */}
        <circle cx="22" cy="34" r="8" className="fill-slate-800 stroke-slate-900" />
        <circle cx="22" cy="34" r="3" className="fill-white" />
        <circle cx="78" cy="34" r="8" className="fill-slate-800 stroke-slate-900" />
        <circle cx="78" cy="34" r="3" className="fill-white" />
        <path d="M 22 34 L 38 24 L 52 24 L 64 16 L 78 34" />
        <path d="M 40 24 L 46 14 L 62 14" />
        <path d="M 52 24 L 68 34" />
        <path d="M 44 14 L 38 12 L 32 14" />
      </svg>
    ),
  },
  {
    type: "LUXURY" as VehicleType,
    label: "Luxury / Supercar",
    arabicLabel: "فاخرة / رياضية",
    description: "High-end luxury sedan, sports car, exotic, or limousine.",
    doors: "2-4 Doors",
    badge: "Premium",
    svgIcon: (
      <svg viewBox="0 0 100 48" className="w-full h-full stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Sports Car Silhouette */}
        <path d="M 6 30 L 26 28 L 38 18 L 62 18 L 84 26 L 94 28 C 96 28 97 30 97 32 L 97 36 L 3 36 L 3 32 C 3 30 4 30 6 30 Z" />
        <path d="M 40 19 L 58 19 L 74 26 L 30 26 Z" className="fill-blue-500/20 stroke-current" strokeWidth="1.5" />
        <circle cx="24" cy="36" r="6" className="fill-slate-800 stroke-slate-900" />
        <circle cx="24" cy="36" r="2.5" className="fill-amber-400" />
        <circle cx="78" cy="36" r="6" className="fill-slate-800 stroke-slate-900" />
        <circle cx="78" cy="36" r="2.5" className="fill-amber-400" />
      </svg>
    ),
  },
];

interface VehicleTypeSelectorProps {
  value: VehicleType;
  onChange: (type: VehicleType) => void;
  showDetails?: boolean;
}

export function VehicleTypeSelector({ value, onChange, showDetails = true }: VehicleTypeSelectorProps) {
  const activeOption = VEHICLE_TYPES_DATA.find((item) => item.type === value) || VEHICLE_TYPES_DATA[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Vehicle Category / نوع المركبة <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] font-medium text-slate-400">Tap reference card to select</span>
      </div>

      {/* Visual Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {VEHICLE_TYPES_DATA.map((item) => {
          const isSelected = item.type === value;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onChange(item.type)}
              className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border-2 transition-all active-tap text-center ${
                isSelected
                  ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
              }`}
            >
              {/* Badge */}
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mb-1 ${
                  isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.badge}
              </span>

              {/* Reference SVG Illustration */}
              <div className={`w-full h-12 my-1 flex items-center justify-center p-1 ${isSelected ? "text-blue-600" : "text-slate-500"}`}>
                {item.svgIcon}
              </div>

              {/* Label */}
              <div>
                <p className="text-xs font-bold leading-tight">{item.label}</p>
                <p className="text-[10px] text-slate-400 font-medium">{item.arabicLabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reference Visual Guide Panel */}
      {showDetails && activeOption && (
        <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <div className="w-16 h-10 shrink-0 text-blue-600 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            {activeOption.svgIcon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{activeOption.label} ({activeOption.arabicLabel})</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                {activeOption.doors}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{activeOption.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
