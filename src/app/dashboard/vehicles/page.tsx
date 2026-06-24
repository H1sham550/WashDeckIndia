import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehiclesDirectory } from "@/components/dashboard/vehicles-directory";

export default async function VehiclesPage() {
  const session = await requireStationUser();

  // Load initial vehicles to display (last 10 registered)
  const initialVehicles = await prisma.vehicle.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    include: {
      contacts: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const serializedVehicles = initialVehicles.map((v) => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    vehicleType: v.vehicleType,
    brand: v.brand,
    model: v.model,
    color: v.color,
    tags: v.tags,
    contacts: v.contacts.map((c) => ({
      id: c.id,
      isPrimary: c.isPrimary,
      label: c.label || "Owner",
      customer: {
        id: c.customer.id,
        name: c.customer.name,
        mobile: c.customer.mobile,
        email: c.customer.email,
      },
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Vehicle Directory</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Search registered vehicles, view customer contact relationships, and register new customer cards.
        </p>
      </div>
      <VehiclesDirectory initialVehicles={serializedVehicles} userRole={session.role} />
    </div>
  );
}
