import { requireStationUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStationEntitlements, getUserStations } from "@/lib/entitlement";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StationSelector } from "@/components/dashboard/station-selector";
import { LogoutButton } from "@/components/layout/logout-button";
import { SpotlightSearch } from "@/components/dashboard/spotlight-search";
import { NotificationCenter } from "@/components/admin/notification-center";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";

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
  const primaryColor = entitlements.features.branding
    ? station?.primaryColor || "#2563EB"
    : "#2563EB";

  const planLabel = entitlements.currentPlanName
    ? `${entitlements.currentPlanName} Plan`
    : undefined;

  return (
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
        {/* Top bar */}
        <header className="wd-topbar">
          {/* Station selector + role badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile: show clean WashDeck shield icon */}
            <div className="md:hidden flex items-center flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={station?.name}
                  className="h-8 w-8 rounded-lg object-contain border border-slate-100"
                />
              ) : (
                <WashDeckLogo variant="icon" className="h-8 w-8 object-contain" />
              )}
            </div>

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

          {/* Right actions - always visible & protected from shrinking */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 z-10">
            <SpotlightSearch />
            <NotificationCenter />
            <LogoutButton />
          </div>
        </header>

        {/* Page content */}
        <main className="wd-main">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav isOwner={isOwner} features={entitlements.features} />
    </div>
  );
}
