import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeFeatureKey } from "@/lib/entitlement";

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

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Plan not found." }, { status: 404 });
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.update({
        where: { id },
        data: {
          name: name || undefined,
          price: price !== undefined ? Number(price) : undefined,
          durationDays: durationDays !== undefined ? parseInt(durationDays, 10) : undefined,
          staffLimit: maxStaff !== undefined ? parseInt(maxStaff, 10) : undefined,
          reportLimit: maxReports !== undefined ? parseInt(maxReports, 10) : undefined,
          description: description !== undefined ? (description || null) : undefined,
          trialDays: trialDays !== undefined ? parseInt(trialDays, 10) : undefined,
          isRecommended: isRecommended !== undefined ? !!isRecommended : undefined,
          isActive: isActive !== undefined ? !!isActive : undefined,
        },
      });

      if (features !== undefined && features) {
        // Clear old features and create new ones
        await tx.planFeature.deleteMany({
          where: { planId: id },
        });

        for (const [key, isEnabled] of Object.entries(features)) {
          const normalizedKey = normalizeFeatureKey(key);
          await tx.planFeature.create({
            data: {
              planId: id,
              featureKey: normalizedKey,
              enabled: !!isEnabled,
            },
          });
        }
      }

      return plan;
    });

    const populated = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { planFeatures: true },
    });

    if (!populated) throw new Error("Plan update failed.");

    const featuresObj: Record<string, boolean> = {};
    populated.planFeatures.forEach(pf => {
      featuresObj[pf.featureKey] = pf.enabled;
      featuresObj[pf.featureKey.toLowerCase()] = pf.enabled;
    });

    const formattedPlan = {
      ...populated,
      features: featuresObj,
      maxStaff: populated.staffLimit,
      maxReports: populated.reportLimit,
    };

    return NextResponse.json({ ok: true, plan: formattedPlan });
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

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE plan error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
