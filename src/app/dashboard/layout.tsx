import { requireStationUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStationEntitlements, getUserStations } from "@/lib/entitlement";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StationSelector } from "@/components/dashboard/station-selector";
import { SpotlightSearch } from "@/components/dashboard/spotlight-search";
import { NotificationCenter } from "@/components/admin/notification-center";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { SwipeBackProvider } from "@/components/layout/swipe-back-provider";
import { Sparkles, Building2 } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStationUser();

  const [entitlements, userStations] = await Promise.all([
    getStationEntitlements(session.stationId),
    getUserStations(session.email, session.role),
  ]);

  if (entitlements.lifecycle === "SUSPENDED") {
    redirect("/suspended" as any);
  }

  const station = entitlements.stationMetadata;

  if (!station) {
    redirect("/login" as any);
  }

  if (station.onboardingStatus === "PENDING") {
    redirect("/onboarding" as any);
  }

  const isOwner = session.role === "OWNER";
  const logoUrl = entitlements.features.branding ? station?.logoUrl : null;
  const bannerUrl = entitlements.features.branding ? station?.bannerUrl : null;
  const primaryColor = entitlements.features.branding
    ? station?.primaryColor || "#2563EB"
    : "#2563EB";

  const planLabel = entitlements.currentPlanName
    ? `${entitlements.currentPlanName} Plan`
    : undefined;

  return (
    <SwipeBackProvider>
      <div
        className="wd-app-shell"
        dir="rtl"
        style={{ "--primary-color": primaryColor } as React.CSSProperties}
      >
        {/* Impersonation banner */}
        {session.impersonatorId && (
          <div className="impersonation-bar" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 60 }}>
            ⚠️ Impersonation Mode — viewing as {station?.name}{" "}
            <a
              href="/api/auth/stop-impersonating"
              style={{ textDecoration: "underline", marginLeft: 8 }}
            >
              Exit
            </a>
          </div>
        )}

        {/* Desktop Sidebar */}
        <AppSidebar
          isOwner={isOwner}
          features={entitlements.features}
          stationName={station?.name || "WashDeck"}
          logoUrl={logoUrl}
          planName={planLabel}
        />

        {/* Main content area */}
        <div className="wd-content-area" style={{ marginTop: session.impersonatorId ? 36 : 0 }}>
          
          {/* ── 1. Store Header / Custom Store Banner ───────────────── */}
          <div className="relative w-full bg-slate-900 text-white shadow-sm z-30">
            {/* Custom Banner Image overlay if uploaded by store owner */}
            {bannerUrl ? (
              <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
                <img src={bannerUrl} alt={station?.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              </div>
            ) : (
              <div 
                className="absolute inset-0 z-0 opacity-90 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #0b192c 100%)`
                }}
              />
            )}

            {/* Banner Header Info Strip */}
            <div className="relative z-10 px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Store Custom Logo / Brand Icon */}
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={station?.name}
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : (
                    <Building2 className="text-white h-6 w-6" />
                  )}
                </div>

                {/* Store Name & Sub-details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                      {station?.name || "WashDeck Car Wash"}
                    </h1>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                      <Sparkles size={10} />
                      {station?.branchCode || "MAIN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium truncate">
                    {session.role === "OWNER" ? "Store Management Portal • Owner POV" : "Operator Intake Center"}
                  </p>
                </div>
              </div>

              {/* Station Badge / Plan Tag */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white border border-white/20">
                  {planLabel || "Pro Store"}
                </span>
              </div>
            </div>

            {/* ── Action Navigation Bar directly below Store Banner ── */}
            <header className="wd-topbar border-t border-white/15 bg-white/95 backdrop-blur-md">
              {/* Station selector + role badge */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StationSelector
                  currentStation={{
                    id: station?.id || session.stationId,
                    name: station?.name || "WashDeck Station",
                    slug: station?.slug || "station",
                  }}
                  userStations={userStations}
                />

                <span
                  className="badge badge-neutral hidden sm:inline-flex flex-shrink-0"
                  style={{ fontSize: 10 }}
                >
                  {session.role}
                </span>
              </div>

              {/* Right actions - Search bar & Notifications (Logout moved to Settings) */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 z-10">
                <SpotlightSearch />
                <NotificationCenter />
              </div>
            </header>
          </div>

          {/* Page content */}
          <main className="wd-main">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav isOwner={isOwner} features={entitlements.features} />
      </div>
    </SwipeBackProvider>
  );
}
