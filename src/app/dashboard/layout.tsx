import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Settings, Gift, ListRestart, Sparkles, BarChart3, Users, Coins } from "lucide-react";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStationUser();
  const station = await prisma.station.findUnique({
    where: { id: session.stationId },
  });

  if (station?.onboardingStatus !== "COMPLETED") {
    redirect("/onboarding" as any);
  }

  const isOwner = session.role === "OWNER";
  
  const offersEnabled = await isFeatureEnabled(session.stationId, "offers");
  const analyticsEnabled = await isFeatureEnabled(session.stationId, "analytics");

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={
        {
          "--primary-color": station?.primaryColor || "#0f766e",
        } as React.CSSProperties
      }
    >
      {session.impersonatorId && (
        <div className="bg-amber-600 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 select-none z-50 sticky top-0 border-b border-amber-700 shadow-sm">
          <span>⚠️ IMPERSONATION MODE: You are viewing this station dashboard as Owner of {station?.name}</span>
          <a
            href="/api/auth/stop-impersonating"
            className="underline hover:text-amber-100 transition-colors ml-2 bg-amber-700 hover:bg-amber-800 px-2 py-0.5 rounded shadow-sm"
          >
            Switch back to Admin
          </a>
        </div>
      )}
      <header className="border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {station?.logoUrl ? (
              <img
                src={station.logoUrl}
                alt={station.name}
                className="h-10 w-10 object-contain rounded-md border"
              />
            ) : (
              <div className="h-10 w-10 flex items-center justify-center rounded-md text-white font-bold bg-[var(--primary-color)] transition-all hover:scale-105 duration-200">
                {station?.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-800">{station?.name}</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                  powered by WashDeck
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                {session.role} PORTAL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Queue
              </Link>
              {isOwner && (
                <>
                  <Link
                    href="/dashboard/staff"
                    className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Staff
                  </Link>
                  <Link
                    href={"/dashboard/finance" as any}
                    className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Finance
                  </Link>
                  <Link
                    href="/dashboard/services"
                    className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Services
                  </Link>
                  {offersEnabled && (
                    <Link
                      href="/dashboard/offers"
                      className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Offers
                    </Link>
                  )}
                  <Link
                    href="/dashboard/recovery"
                    className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Recovery
                  </Link>
                  {analyticsEnabled && (
                    <Link
                      href="/dashboard/analytics"
                      className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Analytics
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Settings
                  </Link>
                </>
              )}
            </nav>
            <LogoutButton />
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="border-t md:hidden flex justify-around py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50/50">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
            <LayoutDashboard size={16} />
            <span>Queue</span>
          </Link>
          {isOwner && (
            <>
              <Link href="/dashboard/staff" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                <Users size={16} />
                <span>Staff</span>
              </Link>
              <Link href={"/dashboard/finance" as any} className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                <Coins size={16} />
                <span>Finance</span>
              </Link>
              <Link href="/dashboard/services" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                <Sparkles size={16} />
                <span>Services</span>
              </Link>
              {offersEnabled && (
                <Link href="/dashboard/offers" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                  <Gift size={16} />
                  <span>Offers</span>
                </Link>
              )}
              <Link href="/dashboard/recovery" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                <ListRestart size={16} />
                <span>Recovery</span>
              </Link>
              {analyticsEnabled && (
                <Link href="/dashboard/analytics" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                  <BarChart3 size={16} />
                  <span>Analytics</span>
                </Link>
              )}
              <Link href="/dashboard/settings" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-700 hover:text-[var(--primary-color)] transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 bg-slate-50/50">
        {children}
      </main>
      <footer className="py-4 border-t bg-white text-center text-[10px] font-bold text-slate-400 tracking-wider">
        Powered by WashDeck
      </footer>
    </div>
  );
}
