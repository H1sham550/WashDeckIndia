import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";
import { StationStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OWNER") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Only station owners can perform onboarding." },
        { status: 401 }
      );
    }

    const stationId = session.stationId;
    if (!stationId) {
      return NextResponse.json(
        { ok: false, error: "Station ID not found in session." },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Support single-page complete batch onboarding (step === 0 or full form submission)
    const isFullSubmission = body.isFullSubmission || body.step === 0;

    if (isFullSubmission) {
      const {
        businessProfile,
        branding,
        payments,
        services,
        loyalty,
        staff,
      } = body;

      if (!businessProfile?.name?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Business / Station Name is required." },
          { status: 400 }
        );
      }

      // 1. Update Station status to ACTIVE and set name
      await prisma.station.update({
        where: { id: stationId },
        data: {
          name: businessProfile.name.trim(),
          status: StationStatus.ACTIVE,
        },
      });

      // 2. Upsert Station Branding
      await prisma.stationBranding.upsert({
        where: { stationId },
        create: {
          stationId,
          businessPhone: businessProfile.phone || null,
          businessEmail: businessProfile.email || null,
          businessAddress: businessProfile.address || null,
          squareLogoUrl: branding?.logoUrl || null,
          bookingCoverUrl: branding?.logoUrl || null,
          primaryColor: branding?.primaryColor || "#0f766e",
        },
        update: {
          businessPhone: businessProfile.phone || null,
          businessEmail: businessProfile.email || null,
          businessAddress: businessProfile.address || null,
          squareLogoUrl: branding?.logoUrl || null,
          bookingCoverUrl: branding?.logoUrl || null,
          primaryColor: branding?.primaryColor || "#0f766e",
        },
      });

      // 3. Upsert Station Settings
      await prisma.stationSettings.upsert({
        where: { stationId },
        create: {
          stationId,
          notificationPreferencesJson: { upiId: payments?.upiId || null },
          queueDisplayPreferencesJson: {
            vipSpendThreshold: loyalty?.vipSpendThreshold ? Number(loyalty.vipSpendThreshold) : 10000.0,
            vipVisitThreshold: loyalty?.vipVisitThreshold ? Number(loyalty.vipVisitThreshold) : 5,
          },
        },
        update: {
          notificationPreferencesJson: { upiId: payments?.upiId || null },
          queueDisplayPreferencesJson: {
            vipSpendThreshold: loyalty?.vipSpendThreshold ? Number(loyalty.vipSpendThreshold) : 10000.0,
            vipVisitThreshold: loyalty?.vipVisitThreshold ? Number(loyalty.vipVisitThreshold) : 5,
          },
        },
      });

      // 4. Create Services if provided
      if (Array.isArray(services) && services.length > 0) {
        await prisma.servicePrice.deleteMany({
          where: { service: { stationId } },
        });
        await prisma.service.deleteMany({
          where: { stationId },
        });

        await prisma.$transaction(
          services.map((service: any) =>
            prisma.service.create({
              data: {
                stationId,
                name: service.name,
                description: service.description || null,
                prices: {
                  create: (service.prices || []).map((p: any) => ({
                    vehicleType: p.vehicleType,
                    price: Number(p.price) || 0,
                  })),
                },
              },
            })
          )
        );
      }

      // 5. Create Loyalty Offer if requested
      if (loyalty?.createOffer && loyalty?.offerName && loyalty?.rewardDescription) {
        const existingOffers = await prisma.offer.findMany({
          where: { stationId },
          select: { id: true },
        });
        const offerIds = existingOffers.map((o) => o.id);

        if (offerIds.length > 0) {
          await prisma.vehicleOfferProgress.deleteMany({
            where: { offerId: { in: offerIds } },
          });
          await prisma.offerVehicle.deleteMany({
            where: { offerId: { in: offerIds } },
          });
        }
        await prisma.offer.deleteMany({ where: { stationId } });

        await prisma.offer.create({
          data: {
            stationId,
            name: loyalty.offerName,
            description: loyalty.offerDesc || null,
            type: "ALL_VEHICLES",
            targetCount: Number(loyalty.targetCount) || 5,
            rewardDescription: loyalty.rewardDescription,
            isActive: true,
          },
        });
      }

      // 6. Create Staff user if provided
      if (staff?.name && (staff?.email || staff?.mobile) && staff?.password) {
        const inputIdentity = (staff.email || staff.mobile).toLowerCase().trim();
        const isEmail = inputIdentity.includes("@");
        const normalizedEmail = isEmail ? inputIdentity : null;
        const normalizedUsername = isEmail ? inputIdentity.split("@")[0] : inputIdentity;

        const existingUser = await prisma.user.findFirst({
          where: {
            stationId,
            OR: [
              normalizedEmail ? { email: normalizedEmail } : {},
              { username: normalizedUsername },
            ].filter((c) => Object.keys(c).length > 0),
            isDeleted: false,
          },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              stationId,
              name: staff.name,
              email: normalizedEmail,
              username: normalizedUsername,
              passwordHash: hashPassword(staff.password),
              role: "STAFF",
              status: "ACTIVE",
              isTempPassword: false,
            },
          });
        }
      }

      // 7. Audit Log
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId,
          action: "ONBOARDING_COMPLETED",
          entityType: "Station",
          entityId: stationId,
        },
      });

      return NextResponse.json({ ok: true, redirectUrl: "/dashboard" });
    }

    // Legacy step-by-step handlers (kept for safety)
    const { step } = body;

    if (step === 1) {
      const { name, phone, email, address } = body;
      if (!name) {
        return NextResponse.json({ ok: false, error: "Business/Station Name is required." }, { status: 400 });
      }

      await prisma.station.update({
        where: { id: stationId },
        data: {
          name,
          status: StationStatus.TRIAL,
        },
      });

      await prisma.stationBranding.upsert({
        where: { stationId },
        create: {
          stationId,
          businessPhone: phone || null,
          businessEmail: email || null,
          businessAddress: address || null,
        },
        update: {
          businessPhone: phone || null,
          businessEmail: email || null,
          businessAddress: address || null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to process onboarding." }, { status: 500 });
  }
}
