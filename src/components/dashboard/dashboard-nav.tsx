"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, 
  Sparkles, 
  Users, 
  Coins, 
  Home, 
  Menu, 
  X, 
  ChevronRight,
  Calendar,
  Package,
  Car,
  Clock,
  LayoutDashboard,
  PlusCircle
} from "lucide-react";

interface DashboardNavProps {
  isOwner: boolean;
  features: {
    staff: boolean;
    offers: boolean;
    analytics: boolean;
    recovery: boolean;
    finance: boolean;
    [key: string]: boolean;
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
    return `px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 text-xs sm:text-sm active-tap ${
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
      {/* Desktop Navigation Links (Clean 9-Item V1 Operational Nav) */}
      <nav className="hidden md:flex items-center gap-1 text-sm">
        <Link href="/dashboard" className={navItemClass("/dashboard")}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </Link>
        <Link href="/dashboard/queue" className={navItemClass("/dashboard/queue")}>
          <Clock size={16} />
          <span>Queue</span>
        </Link>
        <Link href="/dashboard/vehicles" className={navItemClass("/dashboard/vehicles")}>
          <Car size={16} />
          <span>Customers</span>
        </Link>
        <Link href="/dashboard/bookings" className={navItemClass("/dashboard/bookings")}>
          <Calendar size={16} />
          <span>Bookings</span>
        </Link>
        <Link href="/dashboard/services" className={navItemClass("/dashboard/services")}>
          <Sparkles size={16} />
          <span>Services</span>
        </Link>
        <Link href="/dashboard/finance" className={navItemClass("/dashboard/finance")}>
          <Coins size={16} />
          <span>Finance</span>
        </Link>
        {isOwner && (
          <>
            <Link href="/dashboard/staff" className={navItemClass("/dashboard/staff")}>
              <Users size={16} />
              <span>Staff</span>
            </Link>
            <Link href="/dashboard/inventory" className={navItemClass("/dashboard/inventory")}>
              <Package size={16} />
              <span>Inventory</span>
            </Link>
            <Link href="/dashboard/settings" className={navItemClass("/dashboard/settings")}>
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </>
        )}
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar (Operational 1-Hand Usage) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around py-2 text-[10px] bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] pb-safe">
        <Link href="/dashboard" className={mobileItemClass("/dashboard")}>
          <LayoutDashboard size={18} />
          <span>Home</span>
        </Link>
        <Link href="/dashboard/queue" className={mobileItemClass("/dashboard/queue")}>
          <Clock size={18} />
          <span>Queue</span>
        </Link>
        <Link 
          href="/dashboard/jobs/new" 
          className="flex flex-col items-center justify-center -mt-4 bg-[var(--primary-color)] text-white h-12 w-12 rounded-full shadow-lg border-2 border-white active:scale-95 transition-transform"
          title="New Job Card"
        >
          <PlusCircle size={24} />
        </Link>
        <Link href="/dashboard/bookings" className={mobileItemClass("/dashboard/bookings")}>
          <Calendar size={18} />
          <span>Bookings</span>
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
      </div>

      {/* Mobile Slide-Up "More" Drawer Overlay */}
      {isMoreOpen && (
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
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Core Operations</h3>
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
                href="/dashboard/vehicles" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <Car size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700">Customers & Vehicles</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Search registrations, history, & passports.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link 
                href="/dashboard/services" 
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-700">Service Catalog</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage wash packages & detailing rates.</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              {isOwner && (
                <>
                  <Link 
                    href="/dashboard/finance" 
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Coins size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-700">Finance & Invoices</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Daily collections, UPI, & expenses.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>

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
                        <h4 className="text-xs font-bold text-slate-700">Staff Management</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Detailer accounts, roles, & usernames.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>

                  <Link 
                    href="/dashboard/inventory" 
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors active-tap"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                        <Package size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-700">Supplies & Inventory</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Chemical stock, accessories, & alerts.</p>
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Brand logo, inspection rules, & WhatsApp.</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
