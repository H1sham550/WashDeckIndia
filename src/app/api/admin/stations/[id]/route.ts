import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StationStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize super admin
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: stationId } = await params;

    const body = await request.json();
    const {
      status,
      extendDays,
      name,
      slug,
      phone,
      email,
      address,
      upiId,
      gstNumber,
      graceUntil,
      subscriptionId,
    } = body;

    // Verify station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json({ ok: false, error: "Station not found." }, { status: 404 });
    }

    // 2. Process metadata updates
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (slug !== undefined) {
      const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");
      if (normalizedSlug !== station.slug) {
        // Verify unique slug
        const duplicate = await prisma.station.findUnique({ where: { slug: normalizedSlug } });
        if (duplicate) {
          return NextResponse.json({ ok: false, error: "Station slug is already in use." }, { status: 400 });
        }
        dataToUpdate.slug = normalizedSlug;
      }
    }
    if (phone !== undefined) dataToUpdate.phone = phone || null;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (address !== undefined) dataToUpdate.address = address || null;
    if (upiId !== undefined) dataToUpdate.upiId = upiId || null;
    if (gstNumber !== undefined) dataToUpdate.gstNumber = gstNumber || null;
    if (status !== undefined) {
      if (!Object.values(StationStatus).includes(status)) {
        return NextResponse.json({ ok: false, error: "Invalid station status." }, { status: 400 });
      }
      dataToUpdate.status = status as StationStatus;

      // Log status change in AuditLog
      if (status !== station.status) {
        await prisma.auditLog.create({
          data: {
            actorUserId: session.id,
            stationId,
            action: `STATION_STATUS_${status.toUpperCase()}`,
            entityType: "Station",
            entityId: stationId,
            previousValue: { status: station.status },
            newValue: { status },
          },
        });
      }
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.station.update({
        where: { id: stationId },
        data: dataToUpdate,
      });
    }

    // 3. Process subscription plan assignment
    if (subscriptionId !== undefined && subscriptionId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionId },
      });
      if (!plan) {
        return NextResponse.json({ ok: false, error: "Subscription plan not found." }, { status: 404 });
      }

      // Fetch active subscription before deactivating it
      const activeSubBefore = await prisma.stationSubscription.findFirst({
        where: {
          stationId,
          status: { in: ["ACTIVE", "GRACE", "TRIAL"] },
        },
        include: { subscription: true },
      });
      const oldPlanName = activeSubBefore?.subscription.name || "None";

      // Deactivate old active subscriptions
      await prisma.stationSubscription.updateMany({
        where: {
          stationId,
          status: { in: ["ACTIVE", "GRACE", "TRIAL"] },
        },
        data: { status: "EXPIRED" },
      });

      const now = new Date();
      const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      const isTrialPlan = plan.name.toUpperCase() === "TRIAL";
      const newStatus = isTrialPlan ? "TRIAL" : "ACTIVE";

      await prisma.stationSubscription.create({
        data: {
          stationId,
          subscriptionId: plan.id,
          startDate: now,
          endDate,
          status: newStatus,
        },
      });

      // Log subscription assignment
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId,
          action: "PLAN_ASSIGNED",
          entityType: "StationSubscription",
          previousValue: { plan: oldPlanName },
          newValue: { plan: plan.name },
        },
      });

      // Reset expired/suspended status if relevant
      const currentStation = await prisma.station.findUnique({ where: { id: stationId } });
      if (currentStation?.status === StationStatus.EXPIRED || currentStation?.status === StationStatus.SUSPENDED) {
        await prisma.station.update({
          where: { id: stationId },
          data: { status: isTrialPlan ? StationStatus.TRIAL : StationStatus.ACTIVE },
        });
      }
    } else if (extendDays !== undefined && typeof extendDays === "number" && extendDays > 0) {
      let subTemplate = await prisma.subscriptionPlan.findFirst();
      if (!subTemplate) {
        subTemplate = await prisma.subscriptionPlan.create({
          data: {
            name: "Pro Plan",
            price: 2999.00,
            durationDays: 30,
            staffLimit: 10,
            reportLimit: 500,
          },
        });
      }

      const activeSub = await prisma.stationSubscription.findFirst({
        where: {
          stationId,
          status: { in: ["ACTIVE", "GRACE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      const now = new Date();

      if (activeSub) {
        const currentEndDate = new Date(activeSub.endDate);
        const baseDate = currentEndDate > now ? currentEndDate : now;
        const newEndDate = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);

        await prisma.stationSubscription.update({
          where: { id: activeSub.id },
          data: {
            endDate: newEndDate,
            status: activeSub.status === "TRIAL" ? "TRIAL" : "ACTIVE",
          },
        });

        // Log extension
        await prisma.auditLog.create({
          data: {
            actorUserId: session.id,
            stationId,
            action: "SUBSCRIPTION_EXTENDED",
            entityType: "StationSubscription",
            previousValue: { endDate: activeSub.endDate.toISOString() },
            newValue: { endDate: newEndDate.toISOString() },
          },
        });
      } else {
        const newEndDate = new Date(now.getTime() + extendDays * 24 * 60 * 60 * 1000);
        await prisma.stationSubscription.create({
          data: {
            stationId,
            subscriptionId: subTemplate.id,
            startDate: now,
            endDate: newEndDate,
            status: "ACTIVE",
          },
        });

        // Log extension new
        await prisma.auditLog.create({
          data: {
            actorUserId: session.id,
            stationId,
            action: "SUBSCRIPTION_EXTENDED_NEW",
            entityType: "StationSubscription",
            previousValue: { endDate: null },
            newValue: { endDate: newEndDate.toISOString() },
          },
        });
      }

      const currentStation = await prisma.station.findUnique({ where: { id: stationId } });
      if (currentStation?.status === StationStatus.EXPIRED) {
        await prisma.station.update({
          where: { id: stationId },
          data: { status: StationStatus.ACTIVE },
        });
      }
    }

    // 4. Process grace period update
    if (graceUntil !== undefined) {
      const activeSub = await prisma.stationSubscription.findFirst({
        where: {
          stationId,
          status: { in: ["ACTIVE", "GRACE", "TRIAL"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (activeSub) {
        const newGraceDate = graceUntil ? new Date(graceUntil) : null;
        const previousGraceDate = activeSub.graceUntil ? activeSub.graceUntil.toISOString() : "None";
        const newStatus = graceUntil && new Date(graceUntil) > new Date() ? "GRACE" : activeSub.status;

        await prisma.stationSubscription.update({
          where: { id: activeSub.id },
          data: {
            graceUntil: newGraceDate,
            status: newStatus,
          },
        });

        // Log grace period update
        await prisma.auditLog.create({
          data: {
            actorUserId: session.id,
            stationId,
            action: "GRACE_PERIOD_UPDATED",
            entityType: "StationSubscription",
            previousValue: { graceUntil: previousGraceDate },
            newValue: { graceUntil: newGraceDate ? newGraceDate.toISOString() : null },
          },
        });
      }
    }

    // Fetch updated station object
    const updatedStation = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        stationSubscriptions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ ok: true, station: updatedStation });
  } catch (error: any) {
    console.error("PATCH admin station error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize super admin
    await requireRole(["SUPER_ADMIN"]);
    const { id: stationId } = await params;

    // Verify station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json({ ok: false, error: "Station not found." }, { status: 404 });
    }

    // 2. Soft delete station
    await prisma.station.update({
      where: { id: stationId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: StationStatus.SUSPENDED, // fallback status
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE admin station error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
