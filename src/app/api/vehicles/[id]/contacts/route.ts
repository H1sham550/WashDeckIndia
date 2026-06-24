import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id: vehicleId } = await params;
    const body = await request.json();
    const { name, mobile, email, label, isPrimary } = body;

    if (!name || !mobile) {
      return NextResponse.json({ ok: false, error: "Name and mobile number are required." }, { status: 400 });
    }

    // 1. Verify vehicle belongs to station
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, stationId: session.stationId },
    });
    if (!vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
    }

    // 2. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { stationId: session.stationId, mobile },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          stationId: session.stationId,
          name,
          mobile,
          email: email || null,
        },
      });
    }

    // 3. Link customer to vehicle
    // Check if link already exists
    const existingLink = await prisma.vehicleContact.findUnique({
      where: {
        vehicleId_customerId: {
          vehicleId,
          customerId: customer.id,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json({ ok: false, error: "This contact is already linked to the vehicle." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        // Reset primary on other contacts of the vehicle
        await tx.vehicleContact.updateMany({
          where: { vehicleId },
          data: { isPrimary: false },
        });
      }

      await tx.vehicleContact.create({
        data: {
          vehicleId,
          customerId: customer!.id,
          isPrimary: !!isPrimary,
          label: label || "Owner",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("POST vehicle contacts error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id: vehicleId } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ ok: false, error: "customerId is required." }, { status: 400 });
    }

    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, stationId: session.stationId },
    });
    if (!vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
    }

    const contact = await prisma.vehicleContact.findUnique({
      where: {
        vehicleId_customerId: {
          vehicleId,
          customerId,
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ ok: false, error: "Contact link not found." }, { status: 404 });
    }

    if (contact.isPrimary) {
      return NextResponse.json({ ok: false, error: "Cannot delete the primary contact link. Set another contact as primary first." }, { status: 400 });
    }

    await prisma.vehicleContact.delete({
      where: {
        vehicleId_customerId: {
          vehicleId,
          customerId,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE vehicle contacts error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
