import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser();
    const stationId = session.stationId;

    // --- Dynamic Notifications Sync ---

    // 1. Payment Pending (Deduplicated 24-hour window)
    const unpaidCount = await prisma.invoice.count({
      where: {
        jobCard: { stationId, isDeleted: false },
        status: "ISSUED",
      },
    });
    if (unpaidCount > 0) {
      const exists = await prisma.notification.findFirst({
        where: {
          stationId,
          title: "Outstanding Payments Pending",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            stationId,
            title: "Outstanding Payments Pending",
            message: `Checkout payment is pending for ${unpaidCount} vehicles.`,
            priority: "MEDIUM",
          },
        });
      }
    }

    // 2. Staff Limit (Deduplicated 24-hour window)
    const staffCount = await prisma.user.count({
      where: { stationId, isDeleted: false, role: { in: ["OWNER", "STAFF"] } },
    });
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        settings: true,
        stationSubscriptions: {
          where: { status: { in: ["ACTIVE", "GRACE"] } },
          include: { subscription: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });
    const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 5;
    if (staffCount >= allowedStaff) {
      const exists = await prisma.notification.findFirst({
        where: {
          stationId,
          title: "Staff Limit Reached",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            stationId,
            title: "Staff Limit Reached",
            message: `You have reached your limit of ${allowedStaff} staff users. Upgrade your subscription to add more.`,
            priority: "HIGH",
          },
        });
      }
    }

    // 3. Vehicles Near Reward
    const nearRewardProgress = await prisma.vehicleOfferProgress.findMany({
      where: {
        vehicle: { stationId, isDeleted: false },
        offer: { isActive: true, isDeleted: false },
        rewardEarned: false,
      },
      include: { vehicle: true, offer: true },
    });

    for (const prog of nearRewardProgress) {
      if (prog.currentCount === prog.offer.targetCount - 1) {
        const titleText = `Reward Near: ${prog.vehicle.vehicleNumber.toUpperCase()}`;
        const exists = await prisma.notification.findFirst({
          where: {
            stationId,
            title: titleText,
            isRead: false,
          },
        });
        if (!exists) {
          await prisma.notification.create({
            data: {
              stationId,
              title: titleText,
              message: `Vehicle ${prog.vehicle.vehicleNumber.toUpperCase()} is at ${prog.currentCount}/${prog.offer.targetCount} stamps for "${prog.offer.name}". 1 more visit required!`,
              priority: "LOW",
            },
          });
        }
      }
    }

    // 4. Vehicles Eligible for Reward (Reward Earned but not Redeemed)
    const earnedProgress = await prisma.vehicleOfferProgress.findMany({
      where: {
        vehicle: { stationId, isDeleted: false },
        rewardEarned: true,
        rewardRedeemed: false,
      },
      include: { vehicle: true, offer: true },
    });

    for (const prog of earnedProgress) {
      const titleText = `Reward Eligible: ${prog.vehicle.vehicleNumber.toUpperCase()}`;
      const exists = await prisma.notification.findFirst({
        where: {
          stationId,
          title: titleText,
          isRead: false,
        },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            stationId,
            title: titleText,
            message: `Vehicle ${prog.vehicle.vehicleNumber.toUpperCase()} has unlocked the reward: "${prog.offer.rewardDescription}". Redeem on next visit!`,
            priority: "HIGH",
          },
        });
      }
    }

    // 5. Subscription Expiry
    if (station?.stationSubscriptions[0]) {
      const sub = station.stationSubscriptions[0];
      const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft > 0) {
        const exists = await prisma.notification.findFirst({
          where: { stationId, title: "Subscription Expiring Soon", isRead: false },
        });
        if (!exists) {
          await prisma.notification.create({
            data: {
              stationId,
              title: "Subscription Expiring Soon",
              message: `Your WashDeck station subscription plan expires in ${daysLeft} days. Renew to avoid lockout.`,
              priority: "CRITICAL",
            },
          });
        }
      }
    }

    // 6. Vehicles Due for Visit
    const vehicles = await prisma.vehicle.findMany({
      where: { stationId, isDeleted: false },
      include: {
        jobCards: {
          where: { status: "DELIVERED", isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const now = new Date();
    const prefs: any = station?.settings?.queueDisplayPreferencesJson || {};
    const dueThresholdDays = Number(prefs?.dueForVisitThreshold) || 30;
    const lostThresholdDays = Number(prefs?.lostCustomerThresholdDays) || 60;
    const dueVehiclesCount = vehicles.filter((v) => {
      if (v.jobCards.length === 0) return false;
      const lastVisitDate = new Date(v.jobCards[0].createdAt);
      const diffDays = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= dueThresholdDays && diffDays < lostThresholdDays;
    }).length;

    if (dueVehiclesCount > 0) {
      const exists = await prisma.notification.findFirst({
        where: { stationId, title: "Vehicles Due For Detailing", isRead: false },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            stationId,
            title: "Vehicles Due For Detailing",
            message: `${dueVehiclesCount} regular vehicles are due for their next service visit.`,
            priority: "LOW",
          },
        });
      }
    }

    // --- Return Notifications ---
    const notifications = await prisma.notification.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return NextResponse.json({ ok: true, notifications });
  } catch (error: any) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireStationUser();
    const { id, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { stationId: session.stationId, isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      await prisma.notification.update({
        where: { id, stationId: session.stationId },
        data: { isRead: true },
      });
    } else {
      return NextResponse.json({ ok: false, error: "Missing parameters." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
