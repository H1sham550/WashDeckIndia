import { checkSubscription } from "./entitlement";

export async function checkStationStatus(stationId: string): Promise<void> {
  const lifecycle = await checkSubscription(stationId);

  if (lifecycle === "SUSPENDED") {
    const err = new Error("STATION_SUSPENDED: Your station has been suspended by the platform administrator. Access denied.");
    (err as any).statusCode = 403;
    throw err;
  }

  if (lifecycle === "GRACE") {
    const err = new Error("SUBSCRIPTION_READ_ONLY: Your station subscription has expired or is in the grace period. Write access is locked.");
    (err as any).statusCode = 403;
    throw err;
  }

  if (lifecycle === "EXPIRED") {
    const err = new Error("SUBSCRIPTION_EXPIRED: Your station subscription has expired. All operations are locked in view-only mode.");
    (err as any).statusCode = 403;
    throw err;
  }
}
