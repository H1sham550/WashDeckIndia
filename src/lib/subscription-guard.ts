import { prisma } from "@/lib/prisma";

export async function checkStationStatus(stationId: string): Promise<void> {
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    select: { status: true },
  });

  if (!station) {
    throw new Error("Station not found.");
  }

  if (station.status === "SUSPENDED") {
    const err = new Error("STATION_SUSPENDED: Your station has been suspended by the platform administrator. Access denied.");
    (err as any).statusCode = 403;
    throw err;
  }

  if (station.status === "EXPIRED" || (station.status as any) === "GRACE") {
    const err = new Error("SUBSCRIPTION_READ_ONLY: Your station subscription has expired or is in the grace period. Write access is locked.");
    (err as any).statusCode = 403;
    throw err;
  }
}
