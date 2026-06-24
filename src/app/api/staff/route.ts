import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { checkStationStatus } from "@/lib/subscription-guard";
import { requireFeature } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["OWNER"]);
    await requireFeature("staff");
    const staff = await prisma.user.findMany({
      where: {
        stationId: session.stationId,
        isDeleted: false,
        role: { in: ["OWNER", "STAFF"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Retrieve subscription limits
    const station = await prisma.station.findUnique({
      where: { id: session.stationId || "" },
      include: {
        stationSubscriptions: {
          where: { status: { in: ["ACTIVE", "GRACE", "TRIAL"] } },
          include: { subscription: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    const activePlanName = station?.stationSubscriptions[0]?.subscription.name || "Trial Plan";
    const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 5;
    const usedStaff = staff.length;

    return NextResponse.json({
      ok: true,
      staff,
      limits: {
        planName: activePlanName,
        allowedStaff,
        usedStaff,
      },
    });
  } catch (error: any) {
    console.error("GET staff error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["OWNER"]);
    await checkStationStatus(session.stationId || "");
    await requireFeature("staff");
    const body = await request.json();
    const { name, email, mobile, role, password } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json({ ok: false, error: "Name, email, role, and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists globally
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email is already registered on WashDeck." }, { status: 400 });
    }

    // Check plan limits
    const staffCount = await prisma.user.count({
      where: {
        stationId: session.stationId,
        isDeleted: false,
        role: { in: ["OWNER", "STAFF"] },
      },
    });

    const station = await prisma.station.findUnique({
      where: { id: session.stationId || "" },
      include: {
        stationSubscriptions: {
          where: { status: { in: ["ACTIVE", "GRACE", "TRIAL"] } },
          include: { subscription: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 5;
    if (staffCount >= allowedStaff) {
      // Trigger a system alert notification as well
      await prisma.notification.create({
        data: {
          stationId: session.stationId || "",
          title: "Staff Limit Reached",
          message: "You have reached your subscription staff limit. Upgrade your plan to add more users.",
          type: "STAFF_LIMIT",
        },
      });

      return NextResponse.json(
        { ok: false, error: "Staff limit reached. Upgrade your plan to add more users." },
        { status: 400 }
      );
    }

    // Create staff member
    const user = await prisma.user.create({
      data: {
        stationId: session.stationId,
        name,
        email: normalizedEmail,
        mobile: mobile || null,
        role,
        passwordHash: hashPassword(password),
        status: "ACTIVE",
        isTempPassword: true,
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        stationId: session.stationId,
        action: "STAFF_CREATED",
        entityType: "User",
        entityId: user.id,
        metadataJson: { name: user.name, email: user.email, role: user.role },
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    console.error("POST staff error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
