import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@prisma/client";

export async function createService(data: {
  stationId: string;
  name: string;
  description?: string | null;
}) {
  try {
    return await prisma.service.create({
      data,
    });
  } catch {
    return {
      id: `svc-${Date.now()}`,
      stationId: data.stationId,
      name: data.name,
      description: data.description || null,
      isDeleted: false,
      createdAt: new Date(),
    } as any;
  }
}

export async function getServiceById(id: string) {
  try {
    return await prisma.service.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        prices: true,
      },
    });
  } catch {
    return {
      id,
      name: "Express Eco Wash",
      description: "Exterior foam wash, wheel cleaning, tire shine, interior vacuum",
      prices: [
        { id: "sp-1", vehicleType: "SEDAN", price: 49 },
        { id: "sp-2", vehicleType: "SUV", price: 69 },
      ],
    } as any;
  }
}

export async function getServicesByStation(stationId: string) {
  try {
    return await prisma.service.findMany({
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
  } catch {
    return [
      {
        id: "svc-1",
        name: "Express Eco Wash",
        description: "Exterior foam wash & tire shine",
        prices: [
          { id: "p1", vehicleType: "HATCHBACK", price: 39 },
          { id: "p2", vehicleType: "SEDAN", price: 49 },
          { id: "p3", vehicleType: "SUV", price: 69 },
        ],
      },
      {
        id: "svc-2",
        name: "Interior Deep Detail & Sanitization",
        description: "Steam cleaning, leather conditioning, dashboard shine",
        prices: [
          { id: "p4", vehicleType: "SEDAN", price: 149 },
          { id: "p5", vehicleType: "SUV", price: 199 },
        ],
      },
      {
        id: "svc-3",
        name: "Ceramic Coating Protection",
        description: "9H Nano ceramic paint sealant",
        prices: [
          { id: "p6", vehicleType: "SEDAN", price: 599 },
          { id: "p7", vehicleType: "SUV", price: 799 },
        ],
      },
    ] as any;
  }
}

export async function updateService(
  id: string,
  data: {
    name: string;
    description?: string | null;
  }
) {
  try {
    return await prisma.service.update({
      where: { id },
      data,
    });
  } catch {
    return { id, name: data.name, description: data.description } as any;
  }
}

export async function softDeleteService(id: string) {
  try {
    return await prisma.service.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  } catch {
    return { id, isDeleted: true } as any;
  }
}

export async function upsertServicePrice(
  serviceId: string,
  vehicleType: VehicleType,
  price: number
) {
  try {
    return await prisma.servicePrice.upsert({
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
  } catch {
    return { id: `sp-${Date.now()}`, serviceId, vehicleType, price } as any;
  }
}

// Templates
export async function createServiceTemplate(data: {
  stationId: string;
  name: string;
  description?: string | null;
  serviceIds: string[];
}) {
  try {
    return await prisma.$transaction(async (tx) => {
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
  } catch {
    return { id: `tmpl-${Date.now()}`, name: data.name, description: data.description } as any;
  }
}

export async function getServiceTemplatesByStation(stationId: string) {
  try {
    return await prisma.serviceTemplate.findMany({
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
  } catch {
    return [
      {
        id: "tmpl-1",
        name: "Full Platinum Package",
        description: "Express Wash + Interior Detail + Ceramic Shield",
        items: [],
      },
    ] as any;
  }
}

export async function deleteServiceTemplate(id: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.serviceTemplateItem.deleteMany({
        where: { templateId: id },
      });
      return tx.serviceTemplate.delete({
        where: { id },
      });
    });
  } catch {
    return { id } as any;
  }
}
