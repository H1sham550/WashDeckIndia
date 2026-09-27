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
        dir={station?.isRTL ? "rtl" : "ltr"}
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

            {/* Slim 2-Tier Store Header Bar */}
            <div className="relative z-10 px-3.5 sm:px-6 py-2.5 sm:py-3 space-y-2">
              {/* Row 1: Full Store Name, Branding, Location Selector & Plan */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {/* Store Custom Logo / Brand Icon */}
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={station?.name}
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="text-white h-5 w-5" />
                    )}
                  </div>

                  {/* Full Store Name (Ample Space, Unclipped) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-tight">
                        {station?.name || "WashDeck Car Wash"}
                      </h1>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 shrink-0">
                        <Sparkles size={9} />
                        {station?.branchCode || "MAIN"}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/75 font-medium truncate mt-0.5">
                      {session.role === "OWNER" ? "Store Management Portal • Owner POV" : "Operator Intake Center"}
                    </p>
                  </div>
                </div>

                {/* Right side of Row 1: Station Selector & Plan Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <StationSelector
                    currentStation={{
                      id: station?.id || session.stationId,
                      name: station?.name || "WashDeck Station",
                      slug: station?.slug || "station",
                    }}
                    userStations={userStations}
                  />

                  <span className="hidden sm:inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-xs shrink-0">
                    {planLabel || "Pro Store"}
                  </span>
                </div>
              </div>

              {/* Row 2: Search Bar on the Left & Notification Icon on the Right */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
                <div className="flex-1 min-w-0 max-w-md sm:max-w-lg">
                  <SpotlightSearch variant="bar" />
                </div>
                <div className="shrink-0 flex items-center">
                  <NotificationCenter align="right" />
                </div>
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
