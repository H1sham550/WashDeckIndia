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
  UserPlus,
  ClipboardList,
  Bell,
  FileText,
  Settings,
  Receipt,
} from "lucide-react";
import { useState, useEffect } from "react";
import { LogoutButton } from "./logout-button";

interface MobileBottomNavProps {
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

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/finance", label: "Expenses", icon: Receipt },
  { href: "/dashboard/vehicles", label: "Customers", icon: Car },
];

export function MobileBottomNav({ isOwner, features }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handlePopState = () => {
      setShowMoreMenu(false);
    };
    try {
      window.history.pushState({ mobileMenuOpen: true }, "");
    } catch {}
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showMoreMenu]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const navSections = [
    {
      label: "Operations",
      items: [
        { href: "/dashboard/queue", label: "Queue Management", icon: Clock },
        { href: "/dashboard/bookings", label: "Bookings & Appointments", icon: Calendar },
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
      label: "Expense Tracker & Cash Flow",
      items: [
        { href: "/dashboard/finance", label: "Expense Tracker", icon: Receipt },
        { href: "/dashboard/payments", label: "Payment Invoices", icon: CreditCard },
        { href: "/dashboard/inventory", label: "Inventory", icon: Package },
      ],
      ownerOnly: true,
    },
    {
      label: "Team Management",
      items: [
        { href: "/dashboard/staff", label: "Staff Members", icon: Users },
        { href: "/dashboard/staff?action=add", label: "Add New Staff", icon: UserPlus },
        { href: "/dashboard/attendance", label: "Attendance Log", icon: ClipboardList },
      ],
      ownerOnly: true,
    },
    {
      label: "System & Settings",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
        ...(features.analytics && isOwner ? [{ href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 }] : []),
        ...(isOwner ? [{ href: "/dashboard/audit", label: "Audit Log", icon: FileText }] : []),
        ...(isOwner ? [{ href: "/dashboard/settings", label: "Settings", icon: Settings }] : []),
      ],
    },
  ];

  return (
    <>
      {/* Slide-up Menu for "More" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            className="relative bg-white w-full max-h-[85vh] rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full duration-200"
          >
            <div className="flex items-center p-4 border-b text-slate-800">
              <h2 className="font-bold text-base">Store Navigation</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              {navSections.map((section) => {
                if (section.ownerOnly && !isOwner) return null;
                if (section.items.length === 0) return null;

                return (
                  <div key={section.label}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 ml-1">
                      {section.label}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href as any}
                            prefetch={true}
                            onClick={() => setShowMoreMenu(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                              active
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-slate-50 font-medium"
                            }`}
                          >
                            <Icon size={18} strokeWidth={active ? 2.2 : 1.75} />
                            <span className="text-xs">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pinned Footer Bar: Sign Out on far left, Close Menu on far right */}
            <div className="flex-shrink-0 p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between dir-ltr">
              <LogoutButton />
              <button
                data-modal-close-btn="mobile-nav"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
              >
                <X size={14} />
                <span>إغلاق / Close Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-14">
          {BOTTOM_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href as any}
                prefetch={true}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "text-blue-700 font-bold" : "text-slate-700 hover:text-slate-900 font-semibold"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.3 : 1.9} />
                <span className="text-[10px] tracking-tight">
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
              className="h-10 w-10 rounded-full flex items-center justify-center shadow-md bg-blue-600 text-white active-tap"
            >
              <Plus size={20} strokeWidth={2.3} />
            </div>
          </Link>

          {/* More */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              showMoreMenu ? "text-blue-700 font-bold" : "text-slate-700 hover:text-slate-900 font-semibold"
            }`}
            style={{ gridColumn: "5" }}
          >
            <Menu size={20} strokeWidth={showMoreMenu ? 2.3 : 1.9} />
            <span className="text-[10px] tracking-tight">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
