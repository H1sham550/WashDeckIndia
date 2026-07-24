import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  identity: z.string().trim().min(1, "Identity is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please enter your identity and password." },
        { status: 400 }
      );
    }

    const { identity, password } = parsed.data;

    // 1. Authenticate user against Database
    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          { email: { equals: identity, mode: "insensitive" } },
          { username: { equals: identity, mode: "insensitive" } },
        ],
        isDeleted: false,
        status: "ACTIVE",
      },
    });

    const user = candidates.find((candidate) => verifyPassword(password, candidate.passwordHash));

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid identity or password." },
        { status: 401 }
      );
    }

    await createSession({
      id: user.id,
      stationId: user.stationId || "",
      role: user.role,
      name: user.name,
      email: user.email || "",
      isTempPassword: user.isTempPassword,
    });

    // Update lastLogin and audit log in background
    Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          stationId: user.stationId,
          action: "USER_LOGIN_PASSWORD",
          entityType: "User",
          entityId: user.id,
        },
      }),
    ]).catch((err) => console.error("Audit log error:", err));


    return NextResponse.json({
      ok: true,
      redirectTo: user.isTempPassword
        ? "/reset-password"
        : user.role === "SUPER_ADMIN"
        ? "/admin"
        : "/dashboard",
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "auth server ready" });
}

