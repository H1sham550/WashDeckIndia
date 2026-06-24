import { LogoutButton } from "@/components/layout/logout-button";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getStationEntitlements } from "@/lib/entitlement";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStationUser();
  
  // High-performance batched database fetch (combines station status, subscription, plans, and overrides in 1 query)
  const entitlements = await getStationEntitlements(session.stationId);

  // If station is suspended, block access completely
  if (entitlements.lifecycle === "SUSPENDED") {
    redirect("/suspended" as any); // Or let the sub-pages deal with it, but redirecting/showing a message is best.
  }

  const station = await prisma.station.findUnique({
    where: { id: session.stationId },
  });

  if (station?.onboardingStatus !== "COMPLETED") {
    redirect("/onboarding" as any);
  }

  const isOwner = session.role === "OWNER";
  
  const logoUrl = entitlements.features.branding ? station?.logoUrl : null;
  const primaryColor = entitlements.features.branding ? (station?.primaryColor || "#0f766e") : "#0f766e";

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={
        {
          "--primary-color": primaryColor,
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
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={station?.name}
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
            <DashboardNav isOwner={isOwner} features={entitlements.features} />
            <LogoutButton />
          </div>
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
