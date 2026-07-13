"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  ScrollText,
  Settings,
  Package,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",              label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/admin/customers",    label: "Customers",     icon: Users },
  { href: "/admin/subscriptions",label: "Subscriptions", icon: Package },
  { href: "/admin/payments",     label: "Payments",      icon: CreditCard },
  { href: "/admin/invoices",     label: "Invoices",      icon: Receipt },
  { href: "/admin/analytics",    label: "Analytics",     icon: BarChart3 },
  { href: "/admin/audit",        label: "Audit Logs",    icon: ScrollText },
  { href: "/admin/settings",     label: "Settings",      icon: Settings },
];

const MOBILE_ITEMS = NAV_ITEMS.slice(0, 5);

interface AdminNavProps {
  mobile?: boolean;
}

export function AdminNav({ mobile = false }: AdminNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (mobile) {
    return (
      <nav className="flex items-stretch justify-around h-16 px-1">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href as any}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 rounded-xl transition-all duration-150 active-tap px-1",
                active
                  ? "text-wd-teal-700 bg-wd-teal-50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className="flex-shrink-0"
              />
              <span className={cn("text-[9px] font-bold tracking-tight leading-none", active && "font-extrabold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-0.5">
      <p className="px-3 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
        Navigation
      </p>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href as any}
            className={cn(
              "group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active-tap",
              active
                ? "bg-gradient-to-r from-wd-teal-500 to-wd-teal-600 text-white shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon
              size={18}
              strokeWidth={active ? 2.3 : 1.8}
              className={cn(
                "flex-shrink-0 transition-transform duration-150",
                active ? "text-white scale-105" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            <span className="flex-1 truncate">{label}</span>
            {active && <ChevronRight size={14} className="text-white/80" />}
          </Link>
        );
      })}
    </nav>
  );
}
