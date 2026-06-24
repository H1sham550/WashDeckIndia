import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    const plans = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, plans });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    const body = await request.json();
    const {
      name,
      price,
      durationDays,
      maxStaff,
      maxReports,
      description,
      trialDays,
      features,
      isRecommended,
      isActive,
    } = body;

    if (!name || price === undefined || durationDays === undefined || maxStaff === undefined || maxReports === undefined) {
      return NextResponse.json({ ok: false, error: "All plan fields are required." }, { status: 400 });
    }

    const plan = await prisma.subscription.create({
      data: {
        name,
        price: Number(price),
        durationDays: parseInt(durationDays, 10),
        maxStaff: parseInt(maxStaff, 10),
        maxReports: parseInt(maxReports, 10),
        description: description || null,
        trialDays: trialDays !== undefined ? parseInt(trialDays, 10) : 0,
        features: features || { offers: true, reports: true, analytics: true },
        isRecommended: isRecommended !== undefined ? !!isRecommended : false,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error: any) {
    console.error("POST plan error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
