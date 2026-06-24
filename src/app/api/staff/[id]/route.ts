import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["OWNER"]);
    await checkStationStatus(session.stationId || "");
    const { id } = await params;
    const body = await request.json();
    const { name, mobile, role, status } = body;

    const userToEdit = await prisma.user.findFirst({
      where: {
        id,
        stationId: session.stationId,
        isDeleted: false,
      },
    });

    if (!userToEdit) {
      return NextResponse.json({ ok: false, error: "Staff member not found." }, { status: 404 });
    }

    // Capture changes for audit log
    const statusChanged = status !== undefined && userToEdit.status !== status;
    const profileChanged = (name && userToEdit.name !== name) || (mobile !== undefined && userToEdit.mobile !== mobile) || (role && userToEdit.role !== role);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        mobile: mobile !== undefined ? mobile : undefined,
        role: role !== undefined ? role : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    // Record audit trail
    if (statusChanged) {
      const actionStr = status === "INACTIVE" ? "STAFF_DISABLED" : "STAFF_REACTIVATED";
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId: session.stationId,
          action: actionStr,
          entityType: "User",
          entityId: id,
          metadataJson: { name: updated.name, email: updated.email },
        },
      });
    }

    if (profileChanged && !statusChanged) {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId: session.stationId,
          action: "STAFF_UPDATED",
          entityType: "User",
          entityId: id,
          metadataJson: { name: updated.name, role: updated.role },
        },
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (error: any) {
    console.error("PATCH staff details error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["OWNER"]);
    await checkStationStatus(session.stationId || "");
    const { id } = await params;
    const body = await request.json();
    const { action, password } = body;

    const userToEdit = await prisma.user.findFirst({
      where: {
        id,
        stationId: session.stationId,
        isDeleted: false,
      },
    });

    if (!userToEdit) {
      return NextResponse.json({ ok: false, error: "Staff member not found." }, { status: 404 });
    }

    if (action === "password-reset") {
      if (!password || password.trim().length < 6) {
        return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
      }

      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: hashPassword(password),
          isTempPassword: true,
        },
      });

      // Record audit trail
      await prisma.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId: session.stationId,
          action: "STAFF_PASSWORD_RESET",
          entityType: "User",
          entityId: id,
          metadataJson: { name: userToEdit.name, email: userToEdit.email },
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST staff actions error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
