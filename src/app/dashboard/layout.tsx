import { requireStationUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStationEntitlements, getUserStations } from "@/lib/entitlement";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StationSelector } from "@/components/dashboard/station-selector";
import { LogoutButton } from "@/components/layout/logout-button";
import { SpotlightSearch } from "@/components/dashboard/spotlight-search";

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

  if (station?.onboardingStatus !== "COMPLETED") {
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
      dir={station?.isRTL || station?.locale?.startsWith("ar") ? "rtl" : "ltr"}
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
            {/* Mobile: show logo / station name */}
            <div className="md:hidden flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={station?.name}
                  className="h-6 w-6 rounded object-contain"
                />
              ) : (
                <div
                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                  style={{ background: "hsl(var(--brand-blue))", fontSize: 11 }}
                >
                  {station?.name?.charAt(0).toUpperCase()}
                </div>
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
              className="badge badge-neutral hidden sm:inline-flex"
              style={{ fontSize: 10 }}
            >
              {session.role}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <SpotlightSearch />
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
