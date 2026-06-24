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
  return prisma.vehicle.create({
    data,
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findFirst({
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
}

export async function getVehicleByNumber(stationId: string, vehicleNumber: string) {
  const normalized = vehicleNumber.toUpperCase().replace(/\s/g, "");
  return prisma.vehicle.findFirst({
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
}

export async function linkVehicleToCustomer(data: {
  vehicleId: string;
  customerId: string;
  isPrimary?: boolean;
}) {
  return prisma.vehicleContact.create({
    data: {
      vehicleId: data.vehicleId,
      customerId: data.customerId,
      isPrimary: data.isPrimary ?? false,
    },
  });
}

export async function searchVehicles(stationId: string, query: string) {
  const normalizedQuery = query.toUpperCase().replace(/\s/g, "");

  return prisma.vehicle.findMany({
    where: {
      stationId,
      isDeleted: false,
      OR: [
        // Match registration number
        { vehicleNumber: { contains: normalizedQuery, mode: "insensitive" } },
        // Match brand or model
        { brand: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
        // Match contact customer name or phone
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
}
