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
  const primaryColor = entitlements.features.branding ? (station?.primaryColor || "#0b2240") : "#0b2240";

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
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={station?.name}
                className="h-10 w-10 object-contain rounded-xl border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 flex items-center justify-center rounded-xl text-white font-black text-base bg-gradient-to-br from-[#0b2240] via-[#0f2d57] to-[#2563eb] shadow-sm border border-blue-900/10 transition-all duration-200 active-tap hover:scale-[1.03]">
                {station?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-0.5 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-none">
                  {station?.name}
                </span>
                <span className={`inline-flex items-center text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase border ${
                  isOwner 
                    ? "bg-blue-50/60 border-blue-100/80 text-blue-600" 
                    : "bg-slate-50 border-slate-150 text-slate-500"
                }`}>
                  {session.role}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-bold tracking-tight">
                powered by <span className="text-blue-500/90">WashDeck</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <DashboardNav isOwner={isOwner} features={entitlements.features} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-slate-50/50 pb-20 md:pb-0">
        {children}
      </main>
      <footer className="py-4 border-t bg-white text-center text-[10px] font-bold text-slate-400 tracking-wider">
        Powered by WashDeck
      </footer>
    </div>
  );
}
