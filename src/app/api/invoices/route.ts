import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as invoiceService from "@/services/invoice-service";
import { z } from "zod";
import { checkStationStatus } from "@/lib/subscription-guard";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

const createInvoiceSchema = z.object({
  jobCardId: z.string().uuid("Invalid job card ID format"),
  discount: z.number().min(0, "Discount cannot be negative").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);
    const body = await request.json();

    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.generateInvoice(
      session.stationId,
      session.id,
      parsed.data
    );

    return NextResponse.json({ ok: true, invoice });
  } catch (error: any) {
    console.error("POST invoices error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser();
    
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim().toUpperCase();
    const vehicleId = searchParams.get("vehicleId")?.trim();
    const startDateParam = searchParams.get("startDate")?.trim();
    const endDateParam = searchParams.get("endDate")?.trim();

    const whereClause: any = {
      jobCard: {
        stationId: session.stationId,
        isDeleted: false,
      },
    };

    if (statusParam) {
      if (statusParam === "PENDING" || statusParam === "PAID") {
        whereClause.paymentStatus = statusParam as PaymentStatus;
      }
    }

    if (vehicleId) {
      whereClause.jobCard.vehicleId = vehicleId;
    }

    if (startDateParam || endDateParam) {
      whereClause.createdAt = {};
      if (startDateParam) {
        whereClause.createdAt.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        whereClause.createdAt.lte = new Date(endDateParam);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        jobCard: {
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      jobCardId: inv.jobCardId,
      invoiceNumber: inv.invoiceNumber,
      subtotal: inv.subtotal,
      discount: inv.discount,
      finalAmount: inv.finalAmount,
      paymentStatus: inv.paymentStatus,
      paymentMethod: inv.paymentMethod,
      createdAt: inv.createdAt,
      vehicleNumber: inv.jobCard.vehicle.vehicleNumber,
    }));

    return NextResponse.json({ ok: true, invoices: formattedInvoices });
  } catch (error: any) {
    console.error("GET invoices error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
