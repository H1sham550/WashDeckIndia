import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";
import { incrementLoyaltyStamps } from "@/services/loyalty-service";

export async function generateInvoice(
  stationId: string,
  userId: string,
  payload: {
    jobCardId: string;
    discount?: number;
  }
) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify job card
    const jobCard = await tx.jobCard.findUnique({
      where: { id: payload.jobCardId },
      include: {
        services: true,
        invoice: true,
      },
    });

    if (!jobCard || jobCard.stationId !== stationId) {
      throw new Error("Job card not found or unauthorized.");
    }

    if (jobCard.invoice) {
      return jobCard.invoice;
    }

    // 2. Calculate pricing
    const subtotal = jobCard.services.reduce((sum, s) => sum + Number(s.priceSnapshot), 0);
    const discount = payload.discount || 0;
    const finalAmount = Math.max(0, subtotal - discount);

    // 3. Generate unique invoice number
    const rand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${rand}`;

    const invoice = await tx.invoice.create({
      data: {
        stationId,
        jobCardId: payload.jobCardId,
        invoiceNumber,
        subtotal,
        discount,
        finalAmount,
        status: "ISSUED",
      },
    });

    // 4. Update job card status to PAYMENT_PENDING on invoice generation
    await tx.jobCard.update({
      where: { id: payload.jobCardId },
      data: {
        status: "PAYMENT_PENDING",
      },
    });

    // 5. Log audit trail
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        stationId,
        action: "Invoice Generated",
        entityType: "Invoice",
        entityId: invoice.id,
      },
    });

    return invoice;
  });
}

export async function payInvoiceAndDeliver(
  stationId: string,
  userId: string,
  invoiceId: string,
  paymentMethod: PaymentMethod
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        jobCard: true,
      },
    });

    if (!invoice || invoice.jobCard.stationId !== stationId) {
      throw new Error("Invoice not found or unauthorized.");
    }

    if (invoice.status === "PAID") {
      return invoice;
    }

    // 1. Mark invoice as paid
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
      },
    });

    // 2. Create Payment record for enterprise tracking
    await tx.payment.create({
      data: {
        invoiceId,
        amount: invoice.finalAmount,
        method: paymentMethod,
        status: "COMPLETED",
        gatewayName: paymentMethod === "CASH" ? "Cash Counter" : "Direct POS / Terminal"
      }
    });

    // 3. Lock job card and move to DELIVERED status
    await tx.jobCard.update({
      where: { id: invoice.jobCardId },
      data: {
        status: "DELIVERED",
      },
    });

    // 4. Increment loyalty stamps
    await incrementLoyaltyStamps(tx, stationId, invoice.jobCard.vehicleId, invoice.jobCardId);

    // 5. Log audit trail
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        stationId,
        action: `Invoice Paid via ${paymentMethod} and Job Delivered`,
        entityType: "Invoice",
        entityId: invoiceId,
      },
    });

    return updatedInvoice;
  });
}
