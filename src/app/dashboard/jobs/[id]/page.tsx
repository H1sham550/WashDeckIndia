import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as jobCardService from "@/services/job-card-service";
import { JobDetailsView } from "@/components/dashboard/job-details-view";
import { redirect, notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: PageProps) {
  const session = await requireStationUser();
  const { id } = await params;

  let job, station;
  try {
    [job, station] = await Promise.all([
      jobCardService.getJobCardDetails(session.stationId, id),
      prisma.station.findUnique({
        where: { id: session.stationId || "" },
        include: {
          branding: true,
          settings: true,
        },
      }),
    ]);
  } catch (error) {
    console.error("Error loading job card details:", error);
    notFound();
  }

  if (!station) {
    redirect("/login");
  }

  const b = station.branding || ({} as any);
  const s = station.settings || ({} as any);

  const serializedJob = {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    expectedCompletionTime: job.expectedCompletionTime ? job.expectedCompletionTime.toISOString() : null,
    services: job.services.map((srv) => ({
      ...srv,
      priceSnapshot: Number(srv.priceSnapshot),
      createdAt: srv.createdAt.toISOString(),
      updatedAt: srv.updatedAt.toISOString(),
    })),
    invoice: job.invoice
      ? {
          ...job.invoice,
          subtotal: Number(job.invoice.subtotal),
          discount: Number(job.invoice.discount),
          finalAmount: Number(job.invoice.finalAmount),
          paymentStatus: job.invoice.status === "PAID" ? "PAID" : "PENDING",
          paymentMethod: (job.invoice as any).payments?.[0]?.method || null,
          createdAt: job.invoice.createdAt.toISOString(),
          updatedAt: job.invoice.createdAt.toISOString(),
        }
      : null,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JobDetailsView
        job={serializedJob}
        station={{
          name: station.name,
          logoUrl: b.squareLogoUrl || "",
          upiId: "",
          primaryColor: b.primaryColor || "#0f766e",
          serviceCompletedTemplate: "Hi {customerName}, your vehicle {vehicleNumber} has been serviced successfully. Invoice & report: {reportUrl}",
          paymentReminderTemplate: "Hi {customerName}, friendly reminder that payment of {amount} is pending for vehicle {vehicleNumber}.",
        }}
      />
    </div>
  );
}
