import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ vehicleId?: string }>;
};

export default async function JobCardNewRedirectPage({ searchParams }: PageProps) {
  const { vehicleId } = await searchParams;
  if (vehicleId) {
    redirect(`/dashboard/jobs/new?vehicleId=${vehicleId}`);
  }
  redirect("/dashboard/jobs/new");
}
