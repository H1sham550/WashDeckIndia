import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookingRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/book/${slug}`);
}
