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
  Receipt,
  Wrench,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "VEHICLE" | "JOB" | "CUSTOMER" | "EXPENSE" | "SERVICE" | "ACTION";
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
    expenses: SearchResult[];
    services: SearchResult[];
  }>({ vehicles: [], jobs: [], customers: [], expenses: [], services: [] });
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
      title: "Expense Tracker & Cash Flow",
      subtitle: "Track operational expenses, cash inflow, and profit/loss",
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
    if (!isOpen) return;
    const handlePopState = () => {
      setIsOpen(false);
    };
    try {
      window.history.pushState({ spotlightSearchOpen: true }, "");
    } catch {}
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

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
      setResults({ vehicles: [], jobs: [], customers: [], expenses: [], services: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ vehicles: [], jobs: [], customers: [], expenses: [], services: [] });
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
            expenses: data.expenses || [],
            services: data.services || [],
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
    ...results.expenses,
    ...results.services,
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
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/20 bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all text-white text-xs font-semibold group active:scale-95 shrink-0"
        title="Universal Search Across Entire App (Ctrl+K / Cmd+K)"
      >
        <Search size={14} className="text-white/80 group-hover:text-white transition-colors shrink-0" />
        <span className="hidden sm:inline">Universal Search...</span>
        <span className="inline sm:hidden text-[11px] font-bold">Search</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 border border-white/20 text-white">
          ⌘K
        </kbd>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-2 sm:pt-[10vh] px-2 sm:px-4">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 gap-2">
              <Search size={18} className="text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search vehicles, job cards, customers, expenses, services..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 outline-none px-2"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-200/60 rounded-full shrink-0 transition"
                  title="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="max-h-[70vh] sm:max-h-[55vh] overflow-y-auto divide-y divide-slate-100/80 -webkit-overflow-scrolling-touch">
              {loading && (
                <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                  Searching records across full app...
                </div>
              )}

              {!loading && flatList.length === 0 && query.trim().length >= 2 && (
                <div className="px-4 py-10 text-center">
                  <Car size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No results found for "{query}"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try searching by plate number, phone, customer name, expense category, or service.
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
                        className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                          isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-bold truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Universal Search Results */}
              {!loading && query.trim().length >= 2 && flatList.length > 0 && (
                <div className="py-2 space-y-2">
                  {/* Job Cards */}
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
                            className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                              isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                <ClipboardList size={16} />
                              </div>
                              <div className="truncate min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vehicles */}
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
                            className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                              isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                <Car size={16} />
                              </div>
                              <div className="truncate min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Customers */}
                  {results.customers.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Customer Directory ({results.customers.length})
                      </div>
                      {results.customers.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                              isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                <User size={16} />
                              </div>
                              <div className="truncate min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Expenses */}
                  {results.expenses.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Expenses ({results.expenses.length})
                      </div>
                      {results.expenses.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                              isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-rose-50 text-rose-600"
                                }`}
                              >
                                <Receipt size={16} />
                              </div>
                              <div className="truncate min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Services */}
                  {results.services.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Wash Services & Packages ({results.services.length})
                      </div>
                      {results.services.map((item) => {
                        const idx = flatList.findIndex((x) => x.id === item.id);
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between px-3.5 py-3 mx-1.5 my-0.5 rounded-xl cursor-pointer transition-colors active-tap ${
                              isSelected ? "bg-blue-50 text-blue-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-teal-50 text-teal-600"
                                }`}
                              >
                                <Wrench size={16} />
                              </div>
                              <div className="truncate min-w-0">
                                <p className="text-xs font-bold truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className={`shrink-0 ml-2 ${isSelected ? "text-blue-600" : "text-slate-300"}`}
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
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <div className="hidden sm:flex items-center gap-3">
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

              <div className="w-full sm:w-auto flex items-center justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
                  title="Close search modal"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
