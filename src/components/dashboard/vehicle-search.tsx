"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Car, User, Phone, ChevronRight, Loader2, X } from "lucide-react";
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
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/vehicles?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.ok) setResults(data.vehicles || []);
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Registration number, phone, or name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {query && !isSearching && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
          {isSearching && (
            <Loader2
              size={14}
              className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
            />
          )}
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn btn-secondary"
          title="Register new vehicle"
        >
          <Plus size={15} strokeWidth={2} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div
          className="mt-1 border rounded overflow-hidden"
          style={{ borderColor: "hsl(var(--border))", borderRadius: "var(--radius)" }}
        >
          {results.length > 0 ? (
            results.map((v) => {
              const primaryContact =
                v.contacts?.find((c: any) => c.isPrimary)?.customer || v.contacts?.[0]?.customer;
              return (
                <Link
                  key={v.id}
                  href={`/dashboard/vehicles/${v.id}`}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: "1px solid hsl(var(--border))" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="plate">{v.vehicleNumber}</span>
                      <span className="badge badge-neutral" style={{ fontSize: 9 }}>
                        {v.vehicleType}
                      </span>
                    </div>
                    {primaryContact && (
                      <p className="wd-caption mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {primaryContact.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {primaryContact.mobile}
                        </span>
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: "hsl(var(--text-tertiary))", flexShrink: 0 }} />
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="wd-body mb-3">No results for "{query}"</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={13} /> Register Vehicle
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
