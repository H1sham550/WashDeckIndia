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

  let job;
  try {
    job = await jobCardService.getJobCardDetails(session.stationId, id);
  } catch (error) {
    console.error("Error loading job card details:", error);
    notFound();
  }

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
  });

  if (!station) {
    redirect("/login");
  }

  // Helper serialize function
  const serializedJob = {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    expectedCompletionTime: job.expectedCompletionTime ? job.expectedCompletionTime.toISOString() : null,
    services: job.services.map((s) => ({
      ...s,
      priceSnapshot: Number(s.priceSnapshot),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    invoice: job.invoice
      ? {
          ...job.invoice,
          subtotal: Number(job.invoice.subtotal),
          discount: Number(job.invoice.discount),
          finalAmount: Number(job.invoice.finalAmount),
          createdAt: job.invoice.createdAt.toISOString(),
          updatedAt: job.invoice.updatedAt.toISOString(),
        }
      : null,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JobDetailsView
        job={serializedJob}
        station={{
          name: station.name,
          logoUrl: station.logoUrl || "",
          upiId: station.upiId || "",
          primaryColor: station.primaryColor || "#0f766e",
          serviceCompletedTemplate: station.serviceCompletedTemplate || "",
          paymentReminderTemplate: station.paymentReminderTemplate || "",
        }}
      />
    </div>
  );
}
