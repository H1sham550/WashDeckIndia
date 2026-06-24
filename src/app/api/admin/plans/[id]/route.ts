import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;
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

    const existing = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Plan not found." }, { status: 404 });
    }

    const plan = await prisma.subscription.update({
      where: { id },
      data: {
        name: name || undefined,
        price: price !== undefined ? Number(price) : undefined,
        durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : undefined,
        maxStaff: maxStaff !== undefined ? parseInt(maxStaff, 10) : undefined,
        maxReports: maxReports !== undefined ? parseInt(maxReports, 10) : undefined,
        description: description !== undefined ? (description || null) : undefined,
        trialDays: trialDays !== undefined ? parseInt(trialDays, 10) : undefined,
        features: features !== undefined ? features : undefined,
        isRecommended: isRecommended !== undefined ? !!isRecommended : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error: any) {
    console.error("PATCH plan error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    const { id } = await params;

    // Check if any station is using this plan
    const usage = await prisma.stationSubscription.findFirst({
      where: { subscriptionId: id },
    });

    if (usage) {
      return NextResponse.json(
        { ok: false, error: "Cannot delete plan. It is actively linked to station subscriptions." },
        { status: 400 }
      );
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE plan error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
