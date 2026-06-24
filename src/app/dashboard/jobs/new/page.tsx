import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as serviceService from "@/services/service-service";
import { NewJobIntakeWizard } from "@/components/dashboard/new-job-intake-wizard";
import { redirect, notFound } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ vehicleId?: string }>;
};

export default async function NewJobIntakePage({ searchParams }: PageProps) {
  const session = await requireStationUser();
  const { vehicleId } = await searchParams;

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
  });

  if (!station) {
    redirect("/login");
  }

  // Load services and templates
  const services = await serviceService.getStationServices(session.stationId);
  const templates = await serviceService.getStationTemplates(session.stationId);

  // Serialize Decimals to Numbers
  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    prices: s.prices.map((p) => ({
      vehicleType: p.vehicleType,
      price: Number(p.price),
    })),
  }));

  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    items: t.items.map((i) => ({
      service: {
        id: i.service.id,
        name: i.service.name,
        prices: i.service.prices.map((p) => ({
          vehicleType: p.vehicleType,
          price: Number(p.price),
        })),
      },
    })),
  }));

  // Fetch pre-selected vehicle if id is provided
  let preselectedVehicle = null;
  if (vehicleId) {
    const v = await prisma.vehicle.findFirst({
      where: { id: vehicleId, stationId: session.stationId, isDeleted: false },
      include: {
        contacts: {
          include: {
            customer: true,
          },
        },
      },
    });
    if (v) {
      preselectedVehicle = {
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        vehicleType: v.vehicleType,
        brand: v.brand,
        model: v.model,
        color: v.color,
        contacts: v.contacts.map((c) => ({
          isPrimary: c.isPrimary,
          label: c.label || "Owner",
          customer: {
            name: c.customer.name,
            mobile: c.customer.mobile,
          },
        })),
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Job Card Intake</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Perform a 6-step intake checklist to receive and inspect a vehicle for servicing.
        </p>
      </div>
      <NewJobIntakeWizard
        preselectedVehicle={preselectedVehicle}
        services={serializedServices}
        templates={serializedTemplates}
        defaultEtaMinutes={station.defaultEta ?? 120}
      />
    </div>
  );
}
