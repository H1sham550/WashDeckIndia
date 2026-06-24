import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecoveryDashboardData } from "@/services/recovery-service";
import { StationStatus, SubscriptionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorization check
    const authHeader = request.headers.get("authorization");
    const secretParam = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      if (token !== expectedSecret && secretParam !== expectedSecret) {
        return NextResponse.json({ ok: false, error: "Unauthorized cron execution." }, { status: 401 });
      }
    }

    const now = new Date();
    const results: any[] = [];

    // 2. Fetch all non-deleted stations
    const stations = await prisma.station.findMany({
      where: { isDeleted: false },
      include: {
        stationSubscriptions: {
          where: {
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE] },
          },
        },
      },
    });

    console.log(`[Cron] Starting nightly recovery process. Processing ${stations.length} stations.`);

    for (const station of stations) {
      // A. Calculate Revenue Recovery counts
      const recoveryData = await getRecoveryDashboardData(station.id);
      
      console.log(
        `[Cron] Station "${station.name}" (${station.id}): ` +
        `${recoveryData.dueForVisit.length} due for visit, ${recoveryData.lostVehicles.length} lost vehicles.`
      );

      // B. Process Subscriptions expiration check
      let hasActiveOrGrace = false;
      const expiredSubIds: string[] = [];

      for (const sub of station.stationSubscriptions) {
        // If grace period has ended or end date passed with no grace
        const isGraceExpired = sub.graceUntil && sub.graceUntil < now;
        const isStandardExpired = !sub.graceUntil && sub.endDate < now;

        if (isGraceExpired || isStandardExpired) {
          expiredSubIds.push(sub.id);
        } else {
          hasActiveOrGrace = true;
        }
      }

      // Update expired subscription records in DB
      if (expiredSubIds.length > 0) {
        await prisma.stationSubscription.updateMany({
          where: { id: { in: expiredSubIds } },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        console.log(`[Cron] Station "${station.name}" expired subscriptions:`, expiredSubIds);
      }

      // If station has no active/grace subscriptions and status is currently ACTIVE or TRIAL, expire it
      let newStatus: StationStatus | null = null;
      if (!hasActiveOrGrace && (station.status === StationStatus.ACTIVE || station.status === StationStatus.TRIAL)) {
        newStatus = StationStatus.EXPIRED;
        await prisma.station.update({
          where: { id: station.id },
          data: { status: StationStatus.EXPIRED },
        });
        console.log(`[Cron] Station "${station.name}" status updated to EXPIRED.`);
      }

      results.push({
        stationId: station.id,
        name: station.name,
        dueForVisitCount: recoveryData.dueForVisit.length,
        lostVehiclesCount: recoveryData.lostVehicles.length,
        subscriptionsExpiredCount: expiredSubIds.length,
        newStationStatus: newStatus || station.status,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Cron completed successfully.",
      timestamp: now.toISOString(),
      processedStationsCount: stations.length,
      details: results,
    });
  } catch (error: any) {
    console.error("[Cron Error] Nightly process failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
