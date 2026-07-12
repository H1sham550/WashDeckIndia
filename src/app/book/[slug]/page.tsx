import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicBookingWizard } from "@/components/public/public-booking-wizard";
import { Car, MapPin, Phone, ShieldCheck, Sparkles, Award, Clock } from "lucide-react";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const station = await prisma.station.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isDeleted: false,
    },
    select: { name: true, address: true },
  });

  return {
    title: station ? `Book Online | ${station.name} Detailing` : "Online Appointment Booking | WashDeck",
    description: station?.address ? `Instant online car wash & detailing reservations at ${station.name}, ${station.address}.` : "Instant online car wash and detailing reservations.",
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;

  const station = await prisma.station.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      phone: true,
      address: true,
      primaryColor: true,
    },
  });

  if (!station) {
    return notFound();
  }

  const rawServices = await prisma.service.findMany({
    where: {
      stationId: station.id,
      isDeleted: false,
    },
    include: {
      prices: true,
    },
    orderBy: { createdAt: "desc" },
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

  const primaryColor = station.primaryColor || "#0f766e";

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-16"
      style={{ "--primary-color": primaryColor } as React.CSSProperties}
    >
      {/* Hero Banner Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {station.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                {station.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                {station.address && (
                  <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-md">
                    <MapPin size={12} className="shrink-0 text-emerald-400" />
                    <span className="truncate">{station.address}</span>
                  </span>
                )}
                {station.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="shrink-0 text-blue-400" />
                    <span>{station.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online Booking Open</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Intro Banner */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Instant Bay Reservation</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Schedule Your Detailing Session
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
            Skip the queue and reserve an express detailing slot online. Select your vehicle class and choose a suitable time slot.
          </p>
        </div>

        {/* Value Props Strip */}
        <div className="grid grid-cols-3 gap-3 text-center max-w-xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <ShieldCheck className="mx-auto text-blue-400 mb-1" size={20} />
            <span className="text-[11px] font-extrabold text-slate-200 block">Express Bay Check-In</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">No waiting overflow</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <Sparkles className="mx-auto text-amber-400 mb-1" size={20} />
            <span className="text-[11px] font-extrabold text-slate-200 block">Premium Care</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">pH balanced formulas</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <Award className="mx-auto text-emerald-400 mb-1" size={20} />
            <span className="text-[11px] font-extrabold text-slate-200 block">WhatsApp Reports</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">Before/After photos</span>
          </div>
        </div>

        {/* Wizard Component */}
        <div className="text-slate-900">
          <PublicBookingWizard station={station} services={services} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 pt-12 text-center text-xs text-slate-500 font-medium space-y-1">
        <p>© {new Date().getFullYear()} {station.name}. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">Powered by WashDeck — Professional Automotive Detailing Operating System.</p>
      </footer>
    </div>
  );
}
