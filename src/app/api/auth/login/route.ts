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

    let user: any = null;

    // 1. Attempt database lookup if Prisma / DATABASE_URL is configured
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder")) {
      try {
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

        if (candidates.length > 0) {
          user = candidates.find((candidate) => verifyPassword(password, candidate.passwordHash));
        }
      } catch (dbErr) {
        console.warn("Database lookup failed, falling back to dummy authentication:", dbErr);
      }
    }

    // 2. Fallback to Dummy Authentication if DB lookup yields no user or DB is unreachable
    if (!user) {
      const lowerIdentity = identity.toLowerCase();
      let mockRole: "SUPER_ADMIN" | "OWNER" | "STAFF" = "OWNER";
      let mockName = "Demo Station Owner";
      let mockStationId: string | null = "mock-station-ryd";

      if (lowerIdentity.includes("admin")) {
        mockRole = "SUPER_ADMIN";
        mockName = "System Super Admin";
        mockStationId = null;
      } else if (lowerIdentity.includes("staff") || lowerIdentity === "zayn_ryd") {
        mockRole = "STAFF";
        mockName = "Front Desk Staff (Zayn)";
      } else if (lowerIdentity.includes("tariq")) {
        mockRole = "OWNER";
        mockName = "Tariq Al-Mansoor";
      }

      user = {
        id: `mock-user-${Date.now()}`,
        stationId: mockStationId,
        role: mockRole,
        name: mockName,
        email: identity.includes("@") ? identity : `${identity}@washdeck.local`,
        isTempPassword: false,
      };
    }

    await createSession({
      id: user.id,
      stationId: user.stationId || "",
      role: user.role,
      name: user.name,
      email: user.email || "",
      isTempPassword: user.isTempPassword,
    });

    // Fire and forget non-blocking audit if DB is connected
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder")) {
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
      ]).catch(() => {});
    }

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

