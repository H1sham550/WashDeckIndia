"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, Plus, Car, User, Phone, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { RegisterVehicleModal } from "./register-vehicle-modal";

export function VehicleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/vehicles?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.ok) {
          setResults(data.vehicles || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by registration number, phone, customer name..."
          className="h-12 w-full pl-11 pr-12 rounded-xl border bg-white text-sm outline-none focus:ring-4 focus:ring-[var(--primary-color)]/20 focus:border-[var(--primary-color)] transition-all shadow-sm"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSearching ? (
            <Loader2 className="animate-spin text-slate-400" size={18} />
          ) : (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)] text-white hover:brightness-95 transition-all"
              title="Register Vehicle"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown/List */}
      {query.trim().length >= 2 && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-md divide-y max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            results.map((v) => {
              const primaryContact = v.contacts?.find((c: any) => c.isPrimary)?.customer || v.contacts?.[0]?.customer;
              return (
                <Link
                  key={v.id}
                  href={`/dashboard/vehicles/${v.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)] transition-colors">
                      <Car size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 tracking-wide uppercase">
                          {v.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-600">
                          {v.vehicleType.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {primaryContact && (
                          <>
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {primaryContact.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {primaryContact.mobile}
                            </span>
                          </>
                        )}
                        {(v.brand || v.model) && (
                          <span className="text-slate-400">
                            {v.brand} {v.model}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm text-slate-500 space-y-3">
              <p>No vehicles found matching "{query}"</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg bg-[var(--primary-color)] hover:brightness-95 transition"
              >
                <Plus size={14} />
                Register New Vehicle
              </button>
            </div>
          )}
        </div>
      )}

      {showRegisterModal && (
        <RegisterVehicleModal
          onClose={() => setShowRegisterModal(false)}
          initialVehicleNumber={query.match(/^[a-zA-Z0-9\s]+$/) ? query : ""}
        />
      )}
    </div>
  );
}
