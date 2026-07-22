"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Car,
  Wrench,
  Users,
  BarChart2,
  Settings,
  Package,
  CreditCard,
  Gift,
  RotateCcw,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";

interface AppSidebarProps {
  isOwner: boolean;
  features: {
    staff: boolean;
    offers: boolean;
    analytics: boolean;
    recovery: boolean;
    finance: boolean;
    [key: string]: boolean;
  };
  stationName: string;
  logoUrl?: string | null;
  planName?: string;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
  ownerOnly?: boolean;
};

export function AppSidebar({
  isOwner,
  features,
  stationName,
  logoUrl,
  planName,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navSections: NavSection[] = [
    {
      label: "Operations",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/queue", label: "Queue", icon: Clock },
        { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
      ],
    },
    {
      label: "Customers",
      items: [
        { href: "/dashboard/vehicles", label: "Customers", icon: Car },
        ...(features.offers ? [{ href: "/dashboard/offers", label: "Offers & Loyalty", icon: Gift }] : []),
        ...(features.recovery ? [{ href: "/dashboard/recovery", label: "Recovery", icon: RotateCcw }] : []),
      ],
    },
    {
      label: "Finance",
      items: [
        ...(features.finance ? [{ href: "/dashboard/finance", label: "Finance", icon: BarChart2 }] : []),
        { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
        { href: "/dashboard/inventory", label: "Inventory", icon: Package },
      ],
      ownerOnly: true,
    },
    {
      label: "Team",
      items: [
        ...(features.staff ? [{ href: "/dashboard/staff", label: "Staff", icon: Users }] : []),
        { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList },
      ],
      ownerOnly: true,
    },
    {
      label: "System",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
        ...(features.analytics ? [{ href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 }] : []),
        { href: "/dashboard/audit", label: "Audit Log", icon: FileText },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className="wd-sidebar hidden md:flex"
      style={{ width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}
    >
      {/* Logo / Station Name */}
      <div
        className="flex items-center gap-2.5 px-3 border-b border-slate-100"
        style={{ height: "var(--topbar-height)", flexShrink: 0 }}
      >
        {collapsed ? (
          <WashDeckLogo variant="icon" className="h-8 w-8 object-contain mx-auto" />
        ) : logoUrl ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src={logoUrl}
              alt={stationName}
              className="h-8 w-8 rounded-lg object-contain flex-shrink-0 border border-slate-100"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-slate-800 leading-tight">
                {stationName}
              </p>
              {planName && (
                <p className="text-[10px] text-slate-400 truncate">
                  {planName}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <WashDeckLogo variant="full" className="h-9 w-auto max-w-[150px] object-contain flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navSections.map((section) => {
          // Filter owner-only sections
          if (section.ownerOnly && !isOwner) return null;
          // Filter empty sections
          if (section.items.length === 0) return null;

          return (
            <div key={section.label} className="mb-1">
              {!collapsed && (
                <div className="wd-nav-section-label">{section.label}</div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={`wd-nav-item ${active ? "active font-black" : "font-bold text-slate-900 hover:text-slate-950"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.3 : 1.9}
                      className="flex-shrink-0"
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="wd-nav-item w-full justify-center"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={1.75} />
          ) : (
            <>
              <ChevronLeft size={14} strokeWidth={1.75} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
