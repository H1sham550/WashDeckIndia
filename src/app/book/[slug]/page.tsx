import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicBookingWizard } from "@/components/public/public-booking-wizard";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const rawSlug = decodeURIComponent((await params).slug || "").trim();
  const station = await prisma.station.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { id: rawSlug },
        { slug: { equals: rawSlug, mode: "insensitive" } },
        { id: { equals: rawSlug, mode: "insensitive" } },
      ],
    },
    select: { name: true },
  });

  return {
    title: station ? `Book Appointment | ${station.name}` : "Book Appointment | WashDeck",
  };
}

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const rawSlug = decodeURIComponent((await params).slug || "").trim();

  let station = await prisma.station.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { id: rawSlug },
        { slug: { equals: rawSlug, mode: "insensitive" } },
        { id: { equals: rawSlug, mode: "insensitive" } },
      ],
    },
    include: {
      branding: true,
    },
  });

  if (!station && rawSlug && rawSlug.length >= 8) {
    try {
      const userOrExist = await prisma.user.findFirst({ where: { stationId: rawSlug } });
      if (userOrExist || rawSlug.includes("-")) {
        const { getStationEntitlements } = await import("@/lib/entitlement");
        await getStationEntitlements(rawSlug);
        station = await prisma.station.findFirst({
          where: {
            OR: [
              { slug: rawSlug },
              { id: rawSlug },
              { slug: { equals: rawSlug, mode: "insensitive" } },
              { id: { equals: rawSlug, mode: "insensitive" } },
            ],
          },
          include: { branding: true },
        });
      }
    } catch (err) {
      console.error("Public booking page self-healing trigger error:", err);
    }
  }

  if (!station) return notFound();

  const b = station.branding || ({} as any);

  const stationData = {
    id: station.id,
    name: station.name,
    slug: station.slug,
    logoUrl: b.squareLogoUrl || null,
    phone: b.businessPhone || null,
    address: b.businessAddress || null,
    primaryColor: b.primaryColor || "#0f766e",
  };

  const rawServices = await prisma.service.findMany({
    where: { stationId: station.id, isDeleted: false },
    include: { prices: true },
    orderBy: { createdAt: "asc" },
  });

  const services = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    prices: s.prices.map((p) => ({
      vehicleType: p.vehicleType,
      price: Number(p.price),
    })),
  }));

  return (
    <div style={{ minHeight: "100dvh", background: "white" }}>
      <PublicBookingWizard station={stationData} services={services} />
    </div>
  );
}
