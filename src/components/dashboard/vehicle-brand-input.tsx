"use client";

import React, { useState } from "react";

export const POPULAR_INDIAN_BRANDS = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Kia",
  "Toyota",
  "Honda",
  "Volkswagen",
  "Skoda",
  "MG Motors",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Royal Enfield",
  "Hero",
  "TVS",
  "Bajaj",
  "Yamaha",
];

type VehicleBrandInputProps = {
  value: string;
  onChange: (brand: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
};

export function VehicleBrandInput({
  value,
  onChange,
  label = "Brand / Make (Optional)",
  placeholder = "e.g. Maruti Suzuki, Hyundai, Tata",
  className = "",
}: VehicleBrandInputProps) {
  const [showPills, setShowPills] = useState(false);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPills((p) => !p)}
          className="text-[10px] font-bold text-teal-700 hover:text-teal-800 transition underline underline-offset-2"
        >
          {showPills ? "Hide Brands" : "Popular Brands"}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          list="popular-indian-brands-datalist"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)] transition bg-white"
        />

        <datalist id="popular-indian-brands-datalist">
          {POPULAR_INDIAN_BRANDS.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
      </div>

      {/* Quick Pick Pills for Instant 1-Tap Mobile Selection */}
      {showPills && (
        <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-150 max-w-full shadow-inner">
          {POPULAR_INDIAN_BRANDS.map((brand) => {
            const isSelected = value.toLowerCase() === brand.toLowerCase();
            return (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  onChange(brand);
                  setShowPills(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  isSelected
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-teal-500 hover:text-teal-700"
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
