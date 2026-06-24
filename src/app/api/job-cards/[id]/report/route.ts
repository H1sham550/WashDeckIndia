import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkStationStatus } from "@/lib/subscription-guard";
import { generateReportPDF } from "@/lib/pdf-generator";
import fs from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);
    const { id } = await params;

    // Enforce station boundaries and fetch all details for report
    const job = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        vehicle: true,
        customer: true,
        services: true,
        inspection: true,
        invoice: true,
        station: true,
      },
    });

    if (!job || job.stationId !== session.stationId) {
      return NextResponse.json({ ok: false, error: "Job card not found." }, { status: 404 });
    }

    // Fetch or dynamically generate the ServiceReport
    let report = await prisma.serviceReport.findUnique({
      where: { jobCardId: id },
    });

    const secureSlug = report?.secureSlug || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expiryDays = job.station.reportExpiryDays || 30;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    // Prepare PDF data
    const subtotal = job.invoice ? Number(job.invoice.subtotal) : job.services.reduce((sum, s) => sum + Number(s.priceSnapshot), 0);
    const discount = job.invoice ? Number(job.invoice.discount) : 0;
    const finalAmount = job.invoice ? Number(job.invoice.finalAmount) : subtotal;

    const pdfBuffer = generateReportPDF({
      stationName: job.station.name,
      stationAddress: job.station.address || undefined,
      stationPhone: job.station.phone || undefined,
      stationEmail: job.station.email || undefined,
      vehicleNumber: job.vehicle.vehicleNumber,
      vehicleType: job.vehicle.vehicleType,
      vehicleBrand: job.vehicle.brand || undefined,
      vehicleModel: job.vehicle.model || undefined,
      customerName: job.customer.name,
      customerPhone: job.customer.mobile || undefined,
      services: job.services.map(s => ({ name: s.serviceNameSnapshot, price: Number(s.priceSnapshot) })),
      subtotal,
      discount,
      finalAmount,
      notes: job.inspection?.notes || undefined,
      invoiceNumber: job.invoice?.invoiceNumber || undefined,
      createdAt: job.createdAt,
    });

    // Write PDF to public folder
    const reportsDir = path.join(process.cwd(), "public", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const filePath = path.join(reportsDir, `${secureSlug}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    const pdfUrl = `/reports/${secureSlug}.pdf`;

    if (!report) {
      report = await prisma.serviceReport.create({
        data: {
          jobCardId: id,
          secureSlug,
          pdfUrl,
          expiresAt,
        },
      });
    } else {
      report = await prisma.serviceReport.update({
        where: { jobCardId: id },
        data: {
          pdfUrl,
          expiresAt,
        },
      });
    }

    return NextResponse.json({ ok: true, report });
  } catch (error: any) {
    console.error("POST job report error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
