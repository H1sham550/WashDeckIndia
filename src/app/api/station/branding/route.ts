import { NextRequest, NextResponse } from "next/server";
import { requireStationUser, requireRole } from "@/lib/auth";
import * as stationService from "@/services/station-service";
import { z } from "zod";

const updateBrandingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format. Hex format #RRGGBB required.")
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  upiId: z.string().nullable().optional(),
  gstNumber: z.string().nullable().optional(),
  vipSpendThreshold: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  vipVisitThreshold: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  defaultEta: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  reportExpiryDays: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  lostCustomerThresholdDays: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  dueForVisitThreshold: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
  serviceCompletedTemplate: z.string().nullable().optional(),
  paymentReminderTemplate: z.string().nullable().optional(),
  dueForVisitReminderTemplate: z.string().nullable().optional(),
  rewardEligibleTemplate: z.string().nullable().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  latitude: z.union([z.number(), z.null()]).optional(),
  longitude: z.union([z.number(), z.null()]).optional(),
  allowedRadiusMeters: z.union([z.number(), z.string().transform((v) => Number(v))]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser(); // Accessible by OWNER or STAFF
    const branding = await stationService.getStationBranding(session.stationId);
    return NextResponse.json({ ok: true, branding });
  } catch (error: any) {
    console.error("GET branding error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["OWNER"]); // Only OWNER can modify
    const stationId = session.stationId;
    if (!stationId) {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateBrandingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const branding = await stationService.updateStationBranding(stationId, parsed.data);
    return NextResponse.json({ ok: true, branding });
  } catch (error: any) {
    console.error("POST branding error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
