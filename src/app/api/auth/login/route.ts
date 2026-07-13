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
  if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "Auth is not configured yet. Add DATABASE_URL and SESSION_SECRET to .env.",
      },
      { status: 503 }
    );
  }

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

    // Search by email, username, or mobile number across active users
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

    if (candidates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid identity or password." },
        { status: 401 }
      );
    }

    // Verify password against matching candidates (handles identical staff emails/usernames across different stations cleanly)
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

    // Fire and forget non-blocking audit & login timestamp update (does not block HTTP response to client)
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
    ]).catch((err) => console.error("Non-blocking login audit update error:", err));

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

/**
 * GET handler to warm up the serverless function and database connection pool.
 * Triggered silently when the login page mounts, reducing user-perceived cold starts to zero.
 */
export async function GET() {
  try {
    // Run a ultra-fast query to initialize Prisma and warm up the Supabase connection pool
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, message: "auth server warmed" });
  } catch (err) {
    console.error("Auth warmup failed:", err);
    return NextResponse.json({ ok: false, error: "warmup failed" }, { status: 500 });
  }
}

