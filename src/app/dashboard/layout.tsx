import { requireStationUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStationEntitlements, getUserStations } from "@/lib/entitlement";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StationSelector } from "@/components/dashboard/station-selector";
import { SpotlightSearch } from "@/components/dashboard/spotlight-search";
import { NotificationCenter } from "@/components/admin/notification-center";
import { LogoutButton } from "@/components/layout/logout-button";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { SwipeBackProvider } from "@/components/layout/swipe-back-provider";
import { ClickFeedbackProvider } from "@/components/layout/click-feedback-provider";
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
    <ClickFeedbackProvider>
      <SwipeBackProvider>
      <div
        className="wd-app-shell"
        dir={station?.isRTL ?? true ? "rtl" : "ltr"}
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

            {/* Extended Banner Header - Row 1: Store Branding & Badges */}
            <div className="relative z-10 px-4 py-4 sm:px-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Store Custom Logo / Brand Icon */}
                <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={station?.name}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  ) : (
                    <Building2 className="text-white h-7 w-7" />
                  )}
                </div>

                {/* Store Name & Sub-details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-xl font-black text-white truncate tracking-tight">
                      {station?.name || "WashDeck Car Wash"}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                      <Sparkles size={10} />
                      {station?.branchCode || "MAIN"}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                    {session.role === "OWNER" ? "Store Management Portal • Owner POV" : "Operator Intake Center"}
                  </p>
                </div>
              </div>

              {/* Station Badge & Plan Tags */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-xs">
                  {planLabel || "Pro Store"}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 hidden min-[480px]:inline-flex">
                  {session.role}
                </span>
              </div>
            </div>

            {/* Extended Banner Header - Row 2: Navbar Action Strip (Integrated inside Banner) */}
            <div className="relative z-10 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 border-t border-white/15 bg-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <StationSelector
                  currentStation={{
                    id: station?.id || session.stationId,
                    name: station?.name || "WashDeck Station",
                    slug: station?.slug || "station",
                  }}
                  userStations={userStations}
                />
              </div>

              {/* Right Navbar Actions - Universal Search & Notifications */}
              <div className="flex items-center gap-2 shrink-0">
                <SpotlightSearch />
                <NotificationCenter align="left" />
              </div>
            </div>
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
    </ClickFeedbackProvider>
  );
}
