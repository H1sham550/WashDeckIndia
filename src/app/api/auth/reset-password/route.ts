import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { password } = parsed.data;

    // Update password in database
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        passwordHash: hashPassword(password),
        isTempPassword: false,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        stationId: user.stationId,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user.id,
      },
    });

    // Re-issue cookie session payload (clear isTempPassword)
    await createSession({
      id: user.id,
      stationId: user.stationId,
      role: user.role,
      name: user.name || "",
      email: user.email,
      isTempPassword: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to reset password." }, { status: 500 });
  }
}
