import { requireStationUser } from "@/lib/auth";
import { isFeatureEnabled } from "./entitlement";

export { isFeatureEnabled };

export async function requireFeature(featureKey: string): Promise<string> {
  const session = await requireStationUser();
  const enabled = await isFeatureEnabled(session.stationId, featureKey);
  
  if (!enabled) {
    const error = new Error("Feature not enabled for this subscription.");
    (error as any).statusCode = 403;
    throw error;
  }
  
  return session.stationId;
}
