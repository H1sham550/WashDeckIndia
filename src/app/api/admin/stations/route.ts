import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StationStatus, SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { hashPassword } from "@/lib/crypto";

function generateTemporaryPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WD-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate original user as SUPER_ADMIN
    const session = await requireRole(["SUPER_ADMIN"]);
    const body = await request.json();
    const {
      name,
      slug,
      phone,
      email,
      address,
      country,
      currency,
      timezone,
      upiId,
      ownerName,
      ownerEmail,
      ownerMobile,
      gstNumber,
      brandColor,
      logoUrl,
      subscriptionId,
      trialDays,
      graceDays,
      status,
    } = body;

    // Validate request inputs
    if (!name || !slug || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { ok: false, error: "Station name, slug, owner name, and owner email are required." },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    // 2. Validate uniqueness of slug and owner email
    const existingStation = await prisma.station.findUnique({
      where: { slug: normalizedSlug },
    });
    if (existingStation) {
      return NextResponse.json(
        { ok: false, error: `Station with slug "${normalizedSlug}" already exists.` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: ownerEmail.toLowerCase().trim(), isDeleted: false },
    });
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: `User with email "${ownerEmail}" is already registered on the platform.` },
        { status: 400 }
      );
    }

    const tempPassword = generateTemporaryPassword();

    // 3. Atomically execute all onboarding actions within a single database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Station
      const station = await tx.station.create({
        data: {
          name,
          slug: normalizedSlug,
          phone: phone || null,
          email: email || null,
          address: address || null,
          country: country || "IND",
          currency: currency || "INR",
          timezone: timezone || "Asia/Kolkata",
          upiId: upiId || null,
          gstNumber: gstNumber || null,
          primaryColor: brandColor || "#0f766e",
          logoUrl: logoUrl || null,
          status: status || StationStatus.TRIAL,
          onboardingStatus: "NOT_STARTED",
        },
      });

      // Create Owner User
      const owner = await tx.user.create({
        data: {
          stationId: station.id,
          name: ownerName,
          email: ownerEmail.toLowerCase().trim(),
          mobile: ownerMobile || null,
          passwordHash: hashPassword(tempPassword),
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
          isTempPassword: true,
        },
      });

      // Find selected Subscription Plan or fetch default
      let planTemplate = null;
      if (subscriptionId) {
        planTemplate = await tx.subscriptionPlan.findUnique({
          where: { id: subscriptionId },
        });
      }

      if (!planTemplate) {
        planTemplate = await tx.subscriptionPlan.findFirst({
          where: { isActive: true },
          orderBy: { isRecommended: "desc" },
        });
      }

      if (!planTemplate) {
        planTemplate = await tx.subscriptionPlan.findFirst();
      }

      if (!planTemplate) {
        planTemplate = await tx.subscriptionPlan.create({
          data: {
            name: "Pro Plan",
            price: 2999.00,
            durationDays: 30,
            staffLimit: 10,
            reportLimit: 500,
            trialDays: 30,
            isRecommended: true,
            isActive: true,
          },
        });
      }

      // Assign Trial / Paid Station Subscription
      const now = new Date();
      const finalTrialDays = trialDays !== undefined && trialDays !== "" ? parseInt(trialDays, 10) : planTemplate.trialDays;
      const daysCount = finalTrialDays > 0 ? finalTrialDays : planTemplate.durationDays;
      const trialEndDate = new Date(now.getTime() + daysCount * 24 * 60 * 60 * 1000);
      const isTrialPlan = planTemplate.name.toUpperCase() === "TRIAL";
      const newStatus = isTrialPlan ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE;
      const finalGraceDays = graceDays !== undefined ? Number(graceDays) : 5;
      const graceUntilDate = new Date(trialEndDate.getTime() + finalGraceDays * 24 * 60 * 60 * 1000);

      await tx.stationSubscription.create({
        data: {
          stationId: station.id,
          subscriptionId: planTemplate.id,
          startDate: now,
          endDate: trialEndDate,
          graceUntil: graceUntilDate,
          status: newStatus,
        },
      });

      // Specialized Subscription Audit Log
      await tx.subscriptionAuditLog.create({
        data: {
          stationId: station.id,
          action: "PLAN_ASSIGNED",
          previousValue: "None",
          newValue: planTemplate.name,
          performedBy: session.name || session.email,
        },
      });

      // Create Audit Logs
      await tx.auditLog.create({
        data: {
          stationId: station.id,
          action: "STATION_CREATED",
          entityType: "Station",
          entityId: station.id,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: station.id,
          action: "OWNER_CREATED",
          entityType: "User",
          entityId: owner.id,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: station.id,
          action: "SUBSCRIPTION_ASSIGNED",
          entityType: "Subscription",
          entityId: planTemplate.id,
        },
      });

      return { station, owner };
    });

    return NextResponse.json({
      ok: true,
      station: result.station,
      owner: result.owner,
      tempPassword,
    });
  } catch (error: any) {
    console.error("POST create station error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"]);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isDeleted: false,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusParam) {
      if (Object.values(StationStatus).includes(statusParam as StationStatus)) {
        whereClause.status = statusParam as StationStatus;
      }
    }

    const [total, stations] = await Promise.all([
      prisma.station.count({ where: whereClause }),
      prisma.station.findMany({
        where: whereClause,
        include: {
          users: {
            where: {
              isDeleted: false,
              status: "ACTIVE",
            },
          },
          stationSubscriptions: {
            include: {
              subscription: true,
            },
            orderBy: {
              endDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    const formattedStations = stations.map((station) => {
      const activeSub = station.stationSubscriptions[0];
      return {
        id: station.id,
        name: station.name,
        slug: station.slug,
        phone: station.phone,
        email: station.email,
        status: station.status,
        createdAt: station.createdAt,
        planName: activeSub?.subscription.name || "Trial Plan",
        trialDays: activeSub?.subscription.trialDays || 0,
        subscriptionExpiry: activeSub?.endDate || null,
        activeUsersCount: station.users.length,
      };
    });

    return NextResponse.json({
      ok: true,
      stations: formattedStations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET admin stations error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
