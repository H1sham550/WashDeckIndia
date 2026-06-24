import { requireStationUser } from "@/lib/auth";
import * as vehicleService from "@/services/vehicle-service";
import { VehiclePassportView } from "@/components/dashboard/vehicle-passport-view";
import { redirect, notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VehiclePassportPage({ params }: PageProps) {
  const session = await requireStationUser();
  const { id } = await params;

  let passportData;
  try {
    passportData = await vehicleService.getVehiclePassport(id);
  } catch (error) {
    console.error("Error loading vehicle passport:", error);
    notFound();
  }

  // Enforce station isolation
  if (passportData.vehicle.stationId !== session.stationId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <VehiclePassportView userRole={session.role} passport={passportData} />
    </div>
  );
}
