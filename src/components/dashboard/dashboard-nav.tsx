"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Gift, ListRestart, Sparkles, BarChart3, Users, Coins } from "lucide-react";

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

      {/* Mobile Navigation Bar */}
      <div className="border-t md:hidden flex justify-around py-1 text-[10px] bg-slate-50/50">
        <Link href="/dashboard" className={mobileItemClass("/dashboard")}>
          <LayoutDashboard size={16} />
          <span>Queue</span>
        </Link>
        {isOwner && (
          <>
            <Link href="/dashboard/staff" className={mobileItemClass("/dashboard/staff")}>
              <Users size={16} />
              <span className="flex items-center gap-0.5">
                <span>Staff</span>
                {!features.staff && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/finance" className={mobileItemClass("/dashboard/finance")}>
              <Coins size={16} />
              <span className="flex items-center gap-0.5">
                <span>Finance</span>
                {!features.finance && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/services" className={mobileItemClass("/dashboard/services")}>
              <Sparkles size={16} />
              <span>Services</span>
            </Link>
            <Link href="/dashboard/offers" className={mobileItemClass("/dashboard/offers")}>
              <Gift size={16} />
              <span className="flex items-center gap-0.5">
                <span>Offers</span>
                {!features.offers && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/recovery" className={mobileItemClass("/dashboard/recovery")}>
              <ListRestart size={16} />
              <span className="flex items-center gap-0.5">
                <span>Recovery</span>
                {!features.recovery && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/analytics" className={mobileItemClass("/dashboard/analytics")}>
              <BarChart3 size={16} />
              <span className="flex items-center gap-0.5">
                <span>Analytics</span>
                {!features.analytics && <span className="text-[9px]">🔒</span>}
              </span>
            </Link>
            <Link href="/dashboard/settings" className={mobileItemClass("/dashboard/settings")}>
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
