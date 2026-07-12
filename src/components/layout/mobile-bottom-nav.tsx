"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Plus, Car, Menu } from "lucide-react";
import { useState } from "react";

interface MobileBottomNavProps {
  moreHref?: string;
}

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/queue", label: "Queue", icon: Clock },
  { href: "/dashboard/vehicles", label: "Customers", icon: Car },
];

export function MobileBottomNav({ moreHref }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
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
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--brand-blue))", color: "white" }}
          >
            <Plus size={20} strokeWidth={2} />
          </div>
        </Link>

        {/* More */}
        <Link
          href="/dashboard/settings"
          className="flex flex-col items-center justify-center gap-0.5"
          style={{ color: "hsl(var(--text-tertiary))", gridColumn: "5" }}
        >
          <Menu size={20} strokeWidth={1.75} />
          <span style={{ fontSize: "10px" }}>More</span>
        </Link>
      </div>
    </nav>
  );
}
