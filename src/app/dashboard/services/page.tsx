import { requireStationUser } from "@/lib/auth";
import * as serviceService from "@/services/service-service";
import { ServicesPanel } from "@/components/dashboard/services-panel";
import { redirect } from "next/navigation";

export default async function ServicesPage() {
  const session = await requireStationUser();

  if (!session.stationId) {
    redirect("/login");
  }

  const services = await serviceService.getStationServices(session.stationId);
  const templates = await serviceService.getStationTemplates(session.stationId);

  // Serialize Decimal objects from Prisma so they don't crash Next.js serialization
  const serializedServices = services.map((s: any) => ({
    ...s,
    prices: (s.prices || []).map((p: any) => ({
      ...p,
      price: Number(p.price),
    })),
  }));

  const serializedTemplates = templates.map((t: any) => ({
    ...t,
    items: (t.items || []).map((i: any) => ({
      ...i,
      service: {
        ...i.service,
        prices: (i.service?.prices || []).map((p: any) => ({
          ...p,
          price: Number(p.price),
        })),
      },
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Services & Pricing</h1>
        <p className="text-sm text-slate-500">
          Configure wash services, vehicle-type pricing, and quick templates to speed up the vehicle intake flow.
        </p>
      </div>
      <ServicesPanel services={serializedServices} templates={serializedTemplates} />
    </div>
  );
}
