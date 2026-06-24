import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StationStatus, SubscriptionStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize super admin
    await requireRole(["SUPER_ADMIN"]);
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
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.station.update({
        where: { id: stationId },
        data: dataToUpdate,
      });
    }

    // 3. Process subscription updates (either raw extendDays OR assigning plan)
    if (subscriptionId !== undefined && subscriptionId) {
      const plan = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });
      if (!plan) {
        return NextResponse.json({ ok: false, error: "Subscription plan not found." }, { status: 404 });
      }

      // Deactivate old active subscriptions
      await prisma.stationSubscription.updateMany({
        where: {
          stationId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE] },
        },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      const now = new Date();
      const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      await prisma.stationSubscription.create({
        data: {
          stationId,
          subscriptionId: plan.id,
          startDate: now,
          endDate,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Update/Provision Feature Flags based on the plan features configuration
      const planFeatures = (plan.features as Record<string, boolean>) || {
        offers: true,
        reports: true,
        analytics: true,
      };

      for (const [key, isEnabled] of Object.entries(planFeatures)) {
        await prisma.featureFlag.upsert({
          where: {
            stationId_featureKey: {
              stationId,
              featureKey: key,
            },
          },
          update: { isEnabled },
          create: {
            stationId,
            featureKey: key,
            isEnabled,
          },
        });
      }

      // Reset expired status
      const currentStation = await prisma.station.findUnique({ where: { id: stationId } });
      if (currentStation?.status === StationStatus.EXPIRED) {
        await prisma.station.update({
          where: { id: stationId },
          data: { status: StationStatus.ACTIVE },
        });
      }
    } else if (extendDays !== undefined && typeof extendDays === "number" && extendDays > 0) {
      let subTemplate = await prisma.subscription.findFirst();
      if (!subTemplate) {
        subTemplate = await prisma.subscription.create({
          data: {
            name: "Pro Plan",
            price: 2999.00,
            durationDays: 30,
            maxStaff: 10,
            maxReports: 500,
          },
        });
      }

      const activeSub = await prisma.stationSubscription.findFirst({
        where: {
          stationId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE] },
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
            status: SubscriptionStatus.ACTIVE,
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
            status: SubscriptionStatus.ACTIVE,
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
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE] },
        },
        orderBy: { endDate: "desc" },
      });

      if (activeSub) {
        await prisma.stationSubscription.update({
          where: { id: activeSub.id },
          data: {
            graceUntil: graceUntil ? new Date(graceUntil) : null,
            status: graceUntil && new Date(graceUntil) > new Date() ? SubscriptionStatus.GRACE : SubscriptionStatus.ACTIVE,
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
