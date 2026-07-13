"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Car,
  ClipboardList,
  User,
  PlusCircle,
  Clock,
  Calendar,
  BarChart2,
  Settings,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "VEHICLE" | "JOB" | "CUSTOMER" | "ACTION";
  url: string;
  icon?: React.ElementType;
}

export function SpotlightSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    vehicles: SearchResult[];
    jobs: SearchResult[];
    customers: SearchResult[];
  }>({ vehicles: [], jobs: [], customers: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultActions: SearchResult[] = [
    {
      id: "act-new-job",
      title: "New Job Card Intake",
      subtitle: "Register vehicle or check in customer",
      type: "ACTION",
      url: "/dashboard/jobs/new",
      icon: PlusCircle,
    },
    {
      id: "act-queue",
      title: "Live Bay Queue",
      subtitle: "View work-in-progress and bay status",
      type: "ACTION",
      url: "/dashboard/queue",
      icon: Clock,
    },
    {
      id: "act-customers",
      title: "Customer & Vehicle Directory",
      subtitle: "Search vehicle passports and service history",
      type: "ACTION",
      url: "/dashboard/vehicles",
      icon: Car,
    },
    {
      id: "act-bookings",
      title: "Bookings & Appointments",
      subtitle: "Manage scheduled visits and online bookings",
      type: "ACTION",
      url: "/dashboard/bookings",
      icon: Calendar,
    },
    {
      id: "act-finance",
      title: "Finance & Invoices",
      subtitle: "Review revenue reports and payment statuses",
      type: "ACTION",
      url: "/dashboard/finance",
      icon: BarChart2,
    },
    {
      id: "act-settings",
      title: "Station Settings",
      subtitle: "Configure pricing, workflow rules, and branding",
      type: "ACTION",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults({ vehicles: [], jobs: [], customers: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ vehicles: [], jobs: [], customers: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            vehicles: data.vehicles || [],
            jobs: data.jobs || [],
            customers: data.customers || [],
          });
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredActions = defaultActions.filter(
    (act) =>
      act.title.toLowerCase().includes(query.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const flatList: SearchResult[] = [
    ...(query.trim().length < 2 ? filteredActions : []),
    ...results.jobs,
    ...results.vehicles,
    ...results.customers,
  ];

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setIsOpen(false);
      router.push(item.url as any);
    },
    [router]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatList.length ? (prev + 1) % flatList.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        flatList.length ? (prev - 1 + flatList.length) % flatList.length : 0
      );
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatList[selectedIndex]);
    }
  };

  return (
    <>
      {/* Trigger Button in Topbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-500 text-xs font-medium group active-tap"
        title="Universal Search (Ctrl+K / Cmd+K)"
      >
        <Search size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        <span className="hidden sm:inline">Quick Search & Actions...</span>
        <span className="inline sm:hidden">Search</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="relative flex items-center border-b border-slate-100 px-4 py-3 bg-slate-50/50">
              <Search size={18} className="text-slate-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search vehicles, jobs, customers, or jump to..."
                className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100/80">
              {loading && (
                <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                  Searching records across database...
                </div>
              )}

              {!loading && flatList.length === 0 && query.trim().length >= 2 && (
                <div className="px-4 py-10 text-center">
                  <Car size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No results found for "{query}"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try searching by registration number, phone, or job card number.
                  </p>
                </div>
              )}

              {/* Quick Actions section when query is empty or short */}
              {!loading && query.trim().length < 2 && filteredActions.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Navigation & Quick Actions
                  </div>
                  {filteredActions.map((item, idx) => {
                    const Icon = item.icon || Sparkles;
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-3.5 py-2.5 mx-1.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? "bg-wd-blue-50/80 text-wd-blue-800" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? "bg-wd-blue-500 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold">{item.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`shrink-0 ${isSelected ? "text-wd-blue-600" : "text-slate-300"}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Search Results */}
              {!loading && query.trim().length >= 2 && flatList.length > 0 && (
                <div className="py-2 space-y-2">
                  {results.jobs.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Job Cards ({results.jobs.length})
                      </div>
                      {results.jobs.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-2.5 mx-1.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? "bg-wd-blue-50/80 text-wd-blue-800" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg ${
                                  isSelected
                                    ? "bg-wd-blue-500 text-white"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                <ClipboardList size={16} />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ${isSelected ? "text-wd-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {results.vehicles.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Vehicles & Passports ({results.vehicles.length})
                      </div>
                      {results.vehicles.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-2.5 mx-1.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? "bg-wd-blue-50/80 text-wd-blue-800" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg ${
                                  isSelected ? "bg-wd-blue-500 text-white" : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                <Car size={16} />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ${isSelected ? "text-wd-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {results.customers.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Customer Records ({results.customers.length})
                      </div>
                      {results.customers.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-2.5 mx-1.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? "bg-wd-blue-50/80 text-wd-blue-800" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg ${
                                  isSelected ? "bg-wd-blue-500 text-white" : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                <User size={16} />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ${isSelected ? "text-wd-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-bold">↑↓</kbd> to navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-bold">Enter</kbd> to select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-bold">Esc</kbd> to close
                </span>
              </div>
              <span className="font-semibold text-slate-500">Universal Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
