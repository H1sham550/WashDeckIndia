import { prisma } from "@/lib/prisma";
import { requireStationUser } from "@/lib/auth";

export async function isFeatureEnabled(stationId: string, featureKey: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: {
      stationId_featureKey: {
        stationId,
        featureKey,
      },
    },
  });

  return flag ? flag.isEnabled : true;
}

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
