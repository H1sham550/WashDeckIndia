import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as invoiceService from "@/services/invoice-service";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

const payInvoiceSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);
    const { id } = await params;
    const body = await request.json();

    const parsed = payInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.payInvoiceAndDeliver(
      session.stationId,
      session.id,
      id,
      parsed.data.paymentMethod
    );

    return NextResponse.json({ ok: true, invoice });
  } catch (error: any) {
    console.error("PATCH invoice payment error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
