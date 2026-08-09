import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { CommandPalette } from "@/components/admin/command-palette";
import { KeyboardShortcuts } from "@/components/admin/keyboard-shortcuts";
import { NotificationCenter } from "@/components/admin/notification-center";
import { SwipeBackProvider } from "@/components/layout/swipe-back-provider";
import { ShieldCheck } from "lucide-react";

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
      { id: "mock-station-mum", name: "WashDeck Flagship — Mumbai", slug: "washdeck-mumbai" },
      { id: "mock-station-del", name: "WashDeck Express — Delhi", slug: "washdeck-delhi" },
    ];
  }

  return (
    <SwipeBackProvider>
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
          {/* Top Control Bar - Extended Store Owner Theme Header Banner (2-Row Layout) */}
          <header className="sticky top-0 z-30 w-full shadow-lg">
            <div
              className="relative border-b border-white/15"
              style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #0b192c 100%)" }}
            >
              {/* Background Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Extended Banner Header - Row 1: Super Admin Branding & Title */}
              <div className="relative z-10 px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* High Contrast Logo Badge Container */}
                  <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-white p-2 border border-white/30 flex items-center justify-center shrink-0 shadow-md">
                    <WashDeckLogo variant="icon" className="h-full w-full object-contain" />
                  </div>

                  {/* Super Admin Title & Sub-details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-base sm:text-2xl font-black text-white tracking-tight leading-snug">
                        WashDeck Super Admin Portal
                      </h1>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 shrink-0">
                        <ShieldCheck size={10} />
                        SUPER ADMIN
                      </span>
                    </div>
                    <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                      Global Multi-Station Platform Administration • Master Control
                    </p>
                  </div>
                </div>

                {/* Shortcuts & Action Controls (Top Left) */}
                <div className="flex items-center gap-2 shrink-0">
                  <KeyboardShortcuts />
                </div>
              </div>

              {/* Extended Banner Header - Row 2: Navbar Action Strip (RTL Aligned) */}
              <div className="relative z-10 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 border-t border-white/15 bg-white/10 backdrop-blur-md">
                {/* Right Side (RTL): Notifications at Far Right, Search adjacent to it */}
                <div className="flex items-center gap-2.5 flex-1 max-w-xl">
                  <NotificationCenter align="right" />
                  <div className="flex-1 min-w-0">
                    <CommandPalette stations={stations} />
                  </div>
                </div>

                {/* Left Side (RTL): Super Admin Session Info & Logout */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs text-white font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{session.name}</span>
                  </div>
                  <div className="lg:hidden">
                    <LogoutButton />
                  </div>
                </div>
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
    </SwipeBackProvider>
  );
}

// Need React for JSX in layout
import React from "react";

