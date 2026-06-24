import * as serviceRepository from "@/repositories/service-repository";
import type { VehicleType } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function getStationServices(stationId: string) {
  return serviceRepository.getServicesByStation(stationId);
}

export async function createServiceWithPrices(
  stationId: string,
  data: {
    name: string;
    description?: string | null;
    prices: Record<VehicleType, number>;
  }
) {
  await checkStationStatus(stationId);

  const service = await serviceRepository.createService({
    stationId,
    name: data.name,
    description: data.description,
  });

  // Create or update prices for all vehicle types
  const pricePromises = Object.entries(data.prices).map(([vehicleType, price]) =>
    serviceRepository.upsertServicePrice(service.id, vehicleType as VehicleType, price)
  );

  await Promise.all(pricePromises);

  return service;
}

export async function updateServiceWithPrices(
  stationId: string,
  serviceId: string,
  data: {
    name: string;
    description?: string | null;
    prices: Record<VehicleType, number>;
  }
) {
  await checkStationStatus(stationId);

  const service = await serviceRepository.getServiceById(serviceId);
  if (!service || service.stationId !== stationId) {
    throw new Error("Service not found or unauthorized.");
  }

  await serviceRepository.updateService(serviceId, {
    name: data.name,
    description: data.description,
  });

  const pricePromises = Object.entries(data.prices).map(([vehicleType, price]) =>
    serviceRepository.upsertServicePrice(serviceId, vehicleType as VehicleType, price)
  );

  await Promise.all(pricePromises);

  return service;
}

export async function deleteService(stationId: string, serviceId: string) {
  await checkStationStatus(stationId);

  const service = await serviceRepository.getServiceById(serviceId);
  if (!service || service.stationId !== stationId) {
    throw new Error("Service not found or unauthorized.");
  }
  return serviceRepository.softDeleteService(serviceId);
}

// Templates
export async function getStationTemplates(stationId: string) {
  return serviceRepository.getServiceTemplatesByStation(stationId);
}

export async function createTemplate(
  stationId: string,
  data: {
    name: string;
    description?: string | null;
    serviceIds: string[];
  }
) {
  await checkStationStatus(stationId);

  return serviceRepository.createServiceTemplate({
    stationId,
    name: data.name,
    description: data.description,
    serviceIds: data.serviceIds,
  });
}

export async function deleteTemplate(stationId: string, templateId: string) {
  await checkStationStatus(stationId);

  // Validate template exists at station
  const templates = await serviceRepository.getServiceTemplatesByStation(stationId);
  const exists = templates.some((t) => t.id === templateId);
  if (!exists) {
    throw new Error("Template not found or unauthorized.");
  }
  return serviceRepository.deleteServiceTemplate(templateId);
}
