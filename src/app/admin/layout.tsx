import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { CommandPalette } from "@/components/admin/command-palette";
import { KeyboardShortcuts } from "@/components/admin/keyboard-shortcuts";
import { NotificationCenter } from "@/components/admin/notification-center";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce SUPER_ADMIN gate
  const session = await requireRole(["SUPER_ADMIN"]);

  // Fetch stations for the Command Palette search index
  let stations = [];
  try {
    stations = await prisma.station.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    stations = [
      { id: "mock-station-ryd", name: "Apex Luxury Detailing Studio - Riyadh", slug: "apex-riyadh" },
      { id: "mock-station-koc", name: "WashDeck Express - Kochi", slug: "washdeck-kochi" },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex">
      {/* ── Sidebar (Desktop/Tablet) ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[240px] bg-white border-r border-slate-100 shadow-sm z-40">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <WashDeckLogo variant="full" className="h-10 w-auto max-w-[170px] object-contain mix-blend-multiply" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <AdminNav />
        </div>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{session.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">Super Admin</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────── */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen min-w-0">
        {/* Top Control Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Logo on mobile only - clean shield icon without text */}
            <div className="lg:hidden flex-shrink-0">
              <WashDeckLogo variant="icon" className="h-8 w-8 object-contain" />
            </div>
            {/* Global Command Palette */}
            <CommandPalette stations={stations} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 z-10">
            <KeyboardShortcuts />
            <NotificationCenter />
            <div className="lg:hidden pl-1 border-l border-slate-100">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 shadow-lg">
        <AdminNav mobile />
      </div>
    </div>
  );
}

// Need React for JSX in layout
import React from "react";

