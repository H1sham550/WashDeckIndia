import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";
import { OnboardingStatus } from "@prisma/client";

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
    const { step } = body;

    if (step === 1) {
      // Step 1: Business Profile Details
      const { name, phone, email, address, gstNumber } = body;
      if (!name) {
        return NextResponse.json({ ok: false, error: "Business/Station Name is required." }, { status: 400 });
      }

      await prisma.station.update({
        where: { id: stationId },
        data: {
          name,
          phone: phone || null,
          email: email || null,
          address: address || null,
          gstNumber: gstNumber || null,
          onboardingStatus: OnboardingStatus.IN_PROGRESS,
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (step === 2) {
      // Step 2: Branding (Logo, Banner, Brand Color)
      const { logoUrl, bannerUrl, primaryColor } = body;

      await prisma.station.update({
        where: { id: stationId },
        data: {
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
          primaryColor: primaryColor || "#0f766e",
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (step === 3) {
      // Step 3: Payments / UPI Configuration
      const { upiId } = body;

      await prisma.station.update({
        where: { id: stationId },
        data: {
          upiId: upiId || null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (step === 4) {
      // Step 4: Service templates initialization
      const { services } = body;
      if (!services || !Array.isArray(services) || services.length === 0) {
        return NextResponse.json({ ok: false, error: "At least one service must be defined." }, { status: 400 });
      }

      // Check if services already exist for this station; delete them first to allow clean overwrite if user hits "back" and "next"
      await prisma.serviceTemplateItem.deleteMany({
        where: {
          service: {
            stationId,
          },
        },
      });

      await prisma.servicePrice.deleteMany({
        where: {
          service: {
            stationId,
          },
        },
      });

      await prisma.service.deleteMany({
        where: {
          stationId,
        },
      });

      // Create new services and prices
      await prisma.$transaction(
        services.map((service: any) =>
          prisma.service.create({
            data: {
              stationId,
              name: service.name,
              description: service.description || null,
              prices: {
                create: service.prices.map((p: any) => ({
                  vehicleType: p.vehicleType,
                  price: p.price,
                })),
              },
            },
          })
        )
      );

      return NextResponse.json({ ok: true });
    }

    if (step === 5) {
      // Step 5: Loyalty System Configuration
      const { vipSpendThreshold, vipVisitThreshold, offer } = body;

      await prisma.station.update({
        where: { id: stationId },
        data: {
          vipSpendThreshold: vipSpendThreshold !== undefined ? Number(vipSpendThreshold) : 10000.00,
          vipVisitThreshold: vipVisitThreshold !== undefined ? Number(vipVisitThreshold) : 5,
        },
      });

      if (offer) {
        // Find existing offers for this station first
        const existingOffers = await prisma.offer.findMany({
          where: { stationId },
          select: { id: true },
        });
        const offerIds = existingOffers.map((o) => o.id);

        if (offerIds.length > 0) {
          // Delete child records referencing these offers
          await prisma.vehicleOfferProgress.deleteMany({
            where: { offerId: { in: offerIds } },
          });
          await prisma.offerVehicle.deleteMany({
            where: { offerId: { in: offerIds } },
          });
        }

        // Clear existing loyalty offers first to allow overwrite
        await prisma.offer.deleteMany({
          where: { stationId },
        });

        await prisma.offer.create({
          data: {
            stationId,
            name: offer.name,
            description: offer.description || null,
            type: offer.type || "ALL_VEHICLES",
            targetCount: Number(offer.targetCount) || 5,
            rewardDescription: offer.rewardDescription,
            isActive: true,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (step === 6) {
      // Step 6: Staff Creation
      const { staff } = body;
      if (staff) {
        if (!staff.name || !staff.email || !staff.password) {
          return NextResponse.json({ ok: false, error: "Staff name, email, and password are required." }, { status: 400 });
        }

        const inputIdentity = staff.email.toLowerCase().trim();
        const isEmail = inputIdentity.includes("@");
        const normalizedEmail = isEmail ? inputIdentity : null;
        const normalizedUsername = staff.username ? staff.username.toLowerCase().trim() : (isEmail ? inputIdentity.split("@")[0] : inputIdentity);

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

        if (existingUser) {
          if (existingUser.role === "STAFF") {
            return NextResponse.json({ ok: true, message: "Staff user already exists for this station." });
          }
          return NextResponse.json(
            { ok: false, error: "Staff email or username is already registered in this station." },
            { status: 400 }
          );
        }

        await prisma.user.create({
          data: {
            stationId,
            name: staff.name,
            email: normalizedEmail,
            username: normalizedUsername,
            mobile: staff.mobile || null,
            passwordHash: hashPassword(staff.password),
            role: "STAFF",
            status: "ACTIVE",
            isTempPassword: false,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (step === 7) {
      // Step 7: Onboarding Completion
      await prisma.station.update({
        where: { id: stationId },
        data: {
          onboardingStatus: OnboardingStatus.COMPLETED,
        },
      });

      // Create Audit Log for onboarding completion
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId,
          action: "ONBOARDING_COMPLETED",
          entityType: "Station",
          entityId: stationId,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Invalid step request." }, { status: 400 });
  } catch (error: any) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to process onboarding step." }, { status: 500 });
  }
}
