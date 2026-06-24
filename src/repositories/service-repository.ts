import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@prisma/client";

export async function createService(data: {
  stationId: string;
  name: string;
  description?: string | null;
}) {
  return prisma.service.create({
    data,
  });
}

export async function getServiceById(id: string) {
  return prisma.service.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      prices: true,
    },
  });
}

export async function getServicesByStation(stationId: string) {
  return prisma.service.findMany({
    where: {
      stationId,
      isDeleted: false,
    },
    include: {
      prices: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateService(
  id: string,
  data: {
    name: string;
    description?: string | null;
  }
) {
  return prisma.service.update({
    where: { id },
    data,
  });
}

export async function softDeleteService(id: string) {
  return prisma.service.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

export async function upsertServicePrice(
  serviceId: string,
  vehicleType: VehicleType,
  price: number
) {
  return prisma.servicePrice.upsert({
    where: {
      serviceId_vehicleType: {
        serviceId,
        vehicleType,
      },
    },
    update: {
      price,
    },
    create: {
      serviceId,
      vehicleType,
      price,
    },
  });
}

// Templates
export async function createServiceTemplate(data: {
  stationId: string;
  name: string;
  description?: string | null;
  serviceIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.serviceTemplate.create({
      data: {
        stationId: data.stationId,
        name: data.name,
        description: data.description,
      },
    });

    if (data.serviceIds && data.serviceIds.length > 0) {
      await tx.serviceTemplateItem.createMany({
        data: data.serviceIds.map((serviceId) => ({
          templateId: template.id,
          serviceId,
        })),
      });
    }

    return template;
  });
}

export async function getServiceTemplatesByStation(stationId: string) {
  return prisma.serviceTemplate.findMany({
    where: {
      stationId,
    },
    include: {
      items: {
        include: {
          service: {
            include: {
              prices: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function deleteServiceTemplate(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.serviceTemplateItem.deleteMany({
      where: { templateId: id },
    });
    return tx.serviceTemplate.delete({
      where: { id },
    });
  });
}
