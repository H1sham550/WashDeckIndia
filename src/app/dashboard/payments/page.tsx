import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentsPanel } from "@/components/dashboard/payments-panel";
import { redirect } from "next/navigation";

export default async function PaymentsPage() {
  const session = await requireStationUser();

  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      stationId: session.stationId,
      status: "ISSUED",
      jobCard: {
        isDeleted: false,
      },
    },
    include: {
      jobCard: {
        include: {
          vehicle: true,
          customer: true,
          services: true,
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
    include: {
      branding: true,
      settings: true,
    },
  });

  if (!station) {
    redirect("/login");
  }

  const serializedInvoices = unpaidInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    subtotal: Number(inv.subtotal),
    discount: Number(inv.discount),
    finalAmount: Number(inv.finalAmount),
    paymentStatus: inv.status === "PAID" ? "PAID" : "PENDING",
    createdAt: inv.createdAt.toISOString(),
    jobCard: {
      id: inv.jobCard.id,
      status: inv.jobCard.status,
      vehicle: {
        id: inv.jobCard.vehicle.id,
        vehicleNumber: inv.jobCard.vehicle.vehicleNumber,
        vehicleType: inv.jobCard.vehicle.vehicleType,
        brand: inv.jobCard.vehicle.brand,
        model: inv.jobCard.vehicle.model,
      },
      customer: {
        name: inv.jobCard.customer.name,
        mobile: inv.jobCard.customer.mobile,
      },
      services: inv.jobCard.services.map((srv: any) => ({
        serviceNameSnapshot: srv.serviceNameSnapshot,
        priceSnapshot: Number(srv.priceSnapshot),
      })),
    },
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Outstanding Payments</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Monitor all pending checkouts, collect customer payments, and deliver vehicles in real-time.
        </p>
      </div>
      <PaymentsPanel
        initialInvoices={serializedInvoices}
        station={{
          upiId: "",
          name: station.name,
        }}
      />
    </div>
  );
}
