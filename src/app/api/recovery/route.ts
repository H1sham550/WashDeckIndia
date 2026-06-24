import { NextRequest, NextResponse } from "next/server";
import { requireFeature } from "@/lib/feature-flags";
import * as recoveryService from "@/services/recovery-service";

export async function GET(request: NextRequest) {
  try {
    const stationId = await requireFeature("recovery");

    const data = await recoveryService.getRecoveryDashboardData(stationId);
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    console.error("GET recovery error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
