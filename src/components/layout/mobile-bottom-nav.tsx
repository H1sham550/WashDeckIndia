"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Plus,
  Car,
  Menu,
  X,
  Calendar,
  Gift,
  RotateCcw,
  BarChart2,
  CreditCard,
  Package,
  Users,
  ClipboardList,
  Bell,
  FileText,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface MobileBottomNavProps {
  isOwner: boolean;
  features: {
    staff: boolean;
    offers: boolean;
    analytics: boolean;
    recovery: boolean;
    finance: boolean;
  };
}

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/queue", label: "Queue", icon: Clock },
  { href: "/dashboard/vehicles", label: "Customers", icon: Car },
];

export function MobileBottomNav({ isOwner, features }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const navSections = [
    {
      label: "Operations",
      items: [
        { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
      ],
    },
    {
      label: "Customers",
      items: [
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
    <>
      {/* Slide-up Menu for "More" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            className="relative bg-white w-full max-h-[85vh] rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full duration-200"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-slate-800">Menu</h2>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navSections.map((section) => {
                if (section.ownerOnly && !isOwner) return null;
                if (section.items.length === 0) return null;

                return (
                  <div key={section.label}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 ml-1">
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowMoreMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                              active
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="grid grid-cols-5 h-14">
          {BOTTOM_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{
                  color: active ? "hsl(var(--brand-blue))" : "hsl(var(--text-tertiary))",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                <span style={{ fontSize: "10px", fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Centre: New Job FAB */}
          <Link
            href="/dashboard/jobs/new"
            className="flex flex-col items-center justify-center"
            style={{ gridColumn: "4" }}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: "hsl(var(--brand-blue))", color: "white" }}
            >
              <Plus size={20} strokeWidth={2} />
            </div>
          </Link>

          {/* More */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{ color: showMoreMenu ? "hsl(var(--brand-blue))" : "hsl(var(--text-tertiary))", gridColumn: "5" }}
          >
            <Menu size={20} strokeWidth={showMoreMenu ? 2 : 1.75} />
            <span style={{ fontSize: "10px", fontWeight: showMoreMenu ? 500 : 400 }}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
