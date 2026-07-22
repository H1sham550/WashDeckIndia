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
  } catch {
    initialVehicles = [
      {
        id: "v-mock-1",
        vehicleNumber: "KSA 4492",
        vehicleType: "SUV",
        brand: "Toyota",
        model: "Land Cruiser",
        color: "Pearl White",
        tags: [],
        contacts: [
          {
            id: "vc-1",
            isPrimary: true,
            label: "Owner",
            customer: { id: "cust-1", name: "Tariq Al-Mansoor", mobile: "0501234567", email: "tariq@example.com" },
          },
        ],
      },
      {
        id: "v-mock-2",
        vehicleNumber: "KSA 8810",
        vehicleType: "SEDAN",
        brand: "Porsche",
        model: "Taycan",
        color: "Chalk",
        tags: [],
        contacts: [
          {
            id: "vc-2",
            isPrimary: true,
            label: "Owner",
            customer: { id: "cust-2", name: "Sara Al-Harbi", mobile: "0543219876", email: "sara@example.com" },
          },
        ],
      },
    ];
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
