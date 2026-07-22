"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  Shield,
  Sparkles,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  stations?: { id: string; name: string; slug: string }[];
}

export function CommandPalette({ stations = [] }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Navigation actions
  const actions = [
    { id: "nav-dash", title: "Go to Dashboard", subtitle: "Platform overview & KPIs", href: "/admin", icon: BarChart3, category: "Navigation" },
    { id: "nav-cust", title: "Manage Customers", subtitle: "Tenant stations directory & status", href: "/admin/customers", icon: Users, category: "Navigation" },
    { id: "nav-subs", title: "Subscription Plans", subtitle: "Configure SaaS tiers & pricing", href: "/admin/subscriptions", icon: Sparkles, category: "Navigation" },
    { id: "nav-pay", title: "Manual Payment Workflow", subtitle: "Verify transfers & UTR proofs", href: "/admin/payments", icon: CreditCard, category: "Navigation" },
    { id: "nav-inv", title: "Platform Invoices", subtitle: "View generated invoice logs", href: "/admin/invoices", icon: Receipt, category: "Navigation" },
    { id: "nav-ana", title: "SaaS Business Analytics", subtitle: "MRR, ARR, and growth charts", href: "/admin/analytics", icon: BarChart3, category: "Navigation" },
    { id: "nav-aud", title: "Audit Logs", subtitle: "Security and administrative timeline", href: "/admin/audit", icon: Shield, category: "Navigation" },
    { id: "nav-set", title: "Platform Settings", subtitle: "Email, system, and localization", href: "/admin/settings", icon: Settings, category: "Navigation" },
  ];

  // Map stations to searchable items
  const stationItems = stations.map((s) => ({
    id: `station-${s.id}`,
    title: s.name,
    subtitle: `Tenant Station · @${s.slug}`,
    href: `/admin/customers/${s.id}`,
    icon: Building2,
    category: "Customer Stations",
  }));

  const allItems = [...actions, ...stationItems];

  // Filter items by query
  const filtered = query.trim() === ""
    ? actions.slice(0, 8)
    : allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSelect = (href: string) => {
    setOpen(false);
    startTransition(() => {
      router.push(href as any);
    });
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].href);
    }
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors text-xs font-semibold active-tap"
        title="Command Palette (Ctrl+K)"
      >
        <Search size={14} className="text-slate-400" />
        <span className="hidden sm:inline">Search across platform...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-400 rounded border border-slate-200">
          <Command size={10} /> K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-2 sm:pt-[10vh] px-2 sm:px-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Dialog Panel */}
          <div
            className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up"
            onKeyDown={handleListKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2 px-3.5 py-3 border-b border-slate-100 bg-slate-50/50">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search customers, invoices, plans..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg flex-shrink-0"
                >
                  <X size={15} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="px-2 py-1 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold shrink-0 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[70vh] sm:max-h-80 overflow-y-auto p-2 space-y-1 -webkit-overflow-scrolling-touch">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching results found for <span className="font-bold text-slate-600">"{query}"</span>.
                </div>
              ) : (
                filtered.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs",
                        isSelected
                          ? "bg-wd-teal-50 text-wd-teal-900 border border-wd-teal-100 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-wd-teal-100 text-wd-teal-800"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <Icon size={16} strokeWidth={isSelected ? 2.2 : 1.8} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{item.title}</p>
                          <p
                            className={cn(
                              "text-[10px] truncate",
                              isSelected ? "text-wd-teal-700" : "text-slate-400"
                            )}
                          >
                            {item.subtitle} · <span className="font-semibold">{item.category}</span>
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className={cn(
                          "flex-shrink-0 transition-transform",
                          isSelected ? "text-wd-teal-600 translate-x-0.5" : "text-slate-300"
                        )}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <span>Use <kbd className="px-1 py-0.5 bg-white rounded border">↑</kbd> <kbd className="px-1 py-0.5 bg-white rounded border">↓</kbd> to navigate</span>
                <span><kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd> to select</span>
              </div>
              <span><kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
