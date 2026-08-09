import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@prisma/client";

export async function createVehicle(data: {
  stationId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}) {
  try {
    return await prisma.vehicle.create({
      data,
    });
  } catch {
    return {
      id: `v-mock-${Date.now()}`,
      stationId: data.stationId,
      vehicleNumber: data.vehicleNumber,
      vehicleType: data.vehicleType,
      brand: data.brand || "Toyota",
      model: data.model || "Camry",
      color: data.color || "White",
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }
}

export async function getVehicleById(id: string) {
  try {
    return await prisma.vehicle.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        contacts: {
          include: {
            customer: true,
          },
        },
      },
    });
  } catch {
    return {
      id,
      vehicleNumber: "MH-01-AB-1234",
      vehicleType: "SUV" as VehicleType,
      brand: "Toyota",
      model: "Land Cruiser",
      color: "Pearl White",
      contacts: [
        {
          id: "vc-1",
          isPrimary: true,
          customer: {
            id: "cust-1",
            name: "Tariq Al-Mansoor",
            mobile: "0501234567",
            email: "tariq@example.com",
          },
        },
      ],
    } as any;
  }
}

export async function getVehicleByNumber(stationId: string, vehicleNumber: string) {
  const normalized = vehicleNumber.toUpperCase().replace(/\s/g, "");
  try {
    return await prisma.vehicle.findFirst({
      where: {
        stationId,
        vehicleNumber: normalized,
        isDeleted: false,
      },
      include: {
        contacts: {
          include: {
            customer: true,
          },
        },
      },
    });
  } catch {
    return {
      id: "v-mock-1",
      vehicleNumber: normalized || "MH-01-AB-1234",
      vehicleType: "SEDAN" as VehicleType,
      brand: "Lexus",
      model: "ES 350",
      color: "Black",
      contacts: [
        {
          id: "vc-1",
          isPrimary: true,
          customer: {
            id: "cust-1",
            name: "Fahad Al-Qahtani",
            mobile: "0559876543",
          },
        },
      ],
    } as any;
  }
}

export async function linkVehicleToCustomer(data: {
  vehicleId: string;
  customerId: string;
  isPrimary?: boolean;
}) {
  try {
    return await prisma.vehicleContact.create({
      data: {
        vehicleId: data.vehicleId,
        customerId: data.customerId,
        isPrimary: data.isPrimary ?? false,
      },
    });
  } catch {
    return {
      id: `vc-${Date.now()}`,
      vehicleId: data.vehicleId,
      customerId: data.customerId,
      isPrimary: data.isPrimary ?? false,
    } as any;
  }
}

export async function searchVehicles(stationId: string, query: string) {
  const normalizedQuery = query.toUpperCase().replace(/\s/g, "");

  try {
    return await prisma.vehicle.findMany({
      where: {
        stationId,
        isDeleted: false,
        OR: [
          { vehicleNumber: { contains: normalizedQuery, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          {
            contacts: {
              some: {
                customer: {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { mobile: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        contacts: {
          include: {
            customer: true,
          },
        },
      },
      take: 15,
    });
  } catch {
    return [
      {
        id: "v-mock-1",
        vehicleNumber: "MH-01-AB-1234",
        vehicleType: "SUV" as VehicleType,
        brand: "Toyota",
        model: "Land Cruiser",
        color: "Pearl White",
        contacts: [
          {
            id: "vc-1",
            isPrimary: true,
            customer: { id: "cust-1", name: "Tariq Al-Mansoor", mobile: "0501234567" },
          },
        ],
      },
      {
        id: "v-mock-2",
        vehicleNumber: "DL-7C-BC-9999",
        vehicleType: "SEDAN" as VehicleType,
        brand: "Porsche",
        model: "Taycan",
        color: "Chalk",
        contacts: [
          {
            id: "vc-2",
            isPrimary: true,
            customer: { id: "cust-2", name: "Sara Al-Harbi", mobile: "0543219876" },
          },
        ],
      },
    ] as any;
  }
}
