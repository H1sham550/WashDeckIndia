import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VehiclesDirectory } from "@/components/dashboard/vehicles-directory";

export default async function VehiclesPage() {
  const session = await requireStationUser();

  let initialVehicles: any[] = [];
  try {
    initialVehicles = await prisma.vehicle.findMany({
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
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    initialVehicles = [];
  }

  const serializedVehicles = initialVehicles.map((v: any) => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    vehicleType: v.vehicleType,
    brand: v.brand,
    model: v.model,
    color: v.color,
    tags: v.tags || [],
    contacts: (v.contacts || []).map((c: any) => ({
      id: c.id,
      isPrimary: c.isPrimary,
      label: c.label || "Owner",
      customer: {
        id: c.customer?.id || "c-1",
        name: c.customer?.name || "Customer",
        mobile: c.customer?.mobile || "0500000000",
        email: c.customer?.email || null,
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
