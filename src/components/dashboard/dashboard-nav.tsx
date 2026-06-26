"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Gift, 
  ListRestart, 
  Sparkles, 
  BarChart3, 
  Users, 
  Coins, 
  Home, 
  Menu, 
  X, 
  ChevronRight 
} from "lucide-react";

interface DashboardNavProps {
  isOwner: boolean;
  features: {
    staff: boolean;
    offers: boolean;
    analytics: boolean;
    recovery: boolean;
    finance: boolean;
  };
}

export function DashboardNav({ isOwner, features }: DashboardNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Helper to check if a link is active
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const navItemClass = (href: string) => {
    const active = isActive(href);
    return `px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm active-tap ${
      active
        ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-extrabold shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
    }`;
  };

  const mobileItemClass = (href: string) => {
    const active = isActive(href);
    return `flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200 rounded-lg active-tap ${
      active
        ? "text-[var(--primary-color)] bg-[var(--primary-color)]/5 font-extrabold"
        : "text-slate-500 hover:text-slate-900 font-bold"
    }`;
  };

  return (
    <>
      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 text-sm">
        <Link href="/dashboard" className={navItemClass("/dashboard")}>
          Queue
        </Link>
        {isOwner && (
          <>
            <Link href="/dashboard/staff" className={navItemClass("/dashboard/staff")}>
              <span>Staff</span>
              {!features.staff && <span className="text-xs" title="Upgrade Required">🔒</span>}
            </Link>
            <Link href="/dashboard/finance" className={navItemClass("/dashboard/finance")}>
              <span>Finance</span>
              {!features.finance && <span className="text-xs" title="Upgrade Required">🔒</span>}
            </Link>
            <Link href="/dashboard/services" className={navItemClass("/dashboard/services")}>
              Services
            </Link>
            <Link href="/dashboard/offers" className={navItemClass("/dashboard/offers")}>
              <span>Offers</span>
              {!features.offers && <span className="text-xs" title="Upgrade Required">🔒</span>}
            </Link>
            <Link href="/dashboard/recovery" className={navItemClass("/dashboard/recovery")}>
              <span>Recovery</span>
              {!features.recovery && <span className="text-xs" title="Upgrade Required">🔒</span>}
            </Link>
            <Link href="/dashboard/analytics" className={navItemClass("/dashboard/analytics")}>
              <span>Analytics</span>
              {!features.analytics && <span className="text-xs" title="Upgrade Required">🔒</span>}
            </Link>
            <Link href="/dashboard/settings" className={navItemClass("/dashboard/settings")}>
              Settings
            </Link>
          </>
        )}
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-around py-2 text-[10px] bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] pb-safe">
        <Link href="/dashboard" className={mobileItemClass("/dashboard")}>
          <Home size={18} />
          <span>Home</span>
        </Link>
        {isOwner ? (
          <>
            <Link href="/dashboard/finance" className={mobileItemClass("/dashboard/finance")}>
              <Coins size={18} />
              <span className="flex items-center gap-0.5">
                <span>Finance</span>
                {!features.finance && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/services" className={mobileItemClass("/dashboard/services")}>
              <Sparkles size={18} />
              <span>Services</span>
            </Link>
            <button 
              onClick={() => setIsMoreOpen(true)} 
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200 rounded-lg active-tap ${
                isMoreOpen 
                  ? "text-[var(--primary-color)] bg-[var(--primary-color)]/5 font-extrabold" 
                  : "text-slate-500 hover:text-slate-900 font-bold"
              }`}
            >
              <Menu size={18} />
              <span>More</span>
            </button>
          </>
        ) : (
          <div className="w-0 h-0" />
        )}
      </div>

      {/* Mobile Slide-Up "More" Drawer Overlay */}
      {isOwner && isMoreOpen && (
        <>
          {/* Backdrop Blur overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Slide-Up Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 shadow-2xl transition-transform duration-300 md:hidden border-t border-slate-150 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            {/* Drag Handle Bar */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">More Operations</h3>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 active-tap"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="space-y-3">
              <Link 
                href="/dashboard/staff" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Users size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Staff Management</span>
                      {!features.staff && <span className="text-[10px]">🔒</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage detailers, roles, & access.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link 
                href="/dashboard/offers" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Gift size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Offers & Loyalty</span>
                      {!features.offers && <span className="text-[10px]">🔒</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customer rewards, stamps, & coupons.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link 
                href="/dashboard/recovery" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <ListRestart size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Revenue Recovery</span>
                      {!features.recovery && <span className="text-[10px]">🔒</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Recover lost clients & pending dues.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link 
                href="/dashboard/analytics" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <BarChart3 size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Business Analytics</span>
                      {!features.analytics && <span className="text-[10px]">🔒</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Revenue stats, visits, & detailing insights.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link 
                href="/dashboard/settings" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-650">
                    <Settings size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700">Station Settings</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">GST, UPI details, rules, & triggers.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
