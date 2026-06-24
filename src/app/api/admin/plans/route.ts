import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeFeatureKey } from "@/lib/entitlement";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["SUPER_ADMIN"]);
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: { planFeatures: true },
    });

    const formattedPlans = plans.map(plan => {
      const featuresObj: Record<string, boolean> = {};
      plan.planFeatures.forEach(pf => {
        featuresObj[pf.featureKey] = pf.enabled;
        featuresObj[pf.featureKey.toLowerCase()] = pf.enabled;
      });
      return {
        ...plan,
        features: featuresObj,
        maxStaff: plan.staffLimit,
        maxReports: plan.reportLimit,
      };
    });

    return NextResponse.json({ ok: true, plans: formattedPlans });
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

    const plan = await prisma.$transaction(async (tx) => {
      const createdPlan = await tx.subscriptionPlan.create({
        data: {
          name,
          price: Number(price),
          durationDays: parseInt(durationDays, 10),
          staffLimit: parseInt(maxStaff, 10),
          reportLimit: parseInt(maxReports, 10),
          description: description || null,
          trialDays: trialDays !== undefined ? parseInt(trialDays, 10) : 0,
          isRecommended: isRecommended !== undefined ? !!isRecommended : false,
          isActive: isActive !== undefined ? !!isActive : true,
        },
      });

      const featuresObj = features || {
        offers: true,
        reports: true,
        analytics: true,
        recovery: true,
        finance: true,
      };

      for (const [key, isEnabled] of Object.entries(featuresObj)) {
        const normalizedKey = normalizeFeatureKey(key);
        await tx.planFeature.create({
          data: {
            planId: createdPlan.id,
            featureKey: normalizedKey,
            enabled: !!isEnabled,
          },
        });
      }

      return createdPlan;
    });

    const populated = await prisma.subscriptionPlan.findUnique({
      where: { id: plan.id },
      include: { planFeatures: true },
    });

    if (!populated) throw new Error("Plan creation failed.");

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
    console.error("POST plan error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
