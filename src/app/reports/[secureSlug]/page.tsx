import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Car, User, Check, ShieldCheck, Printer, Download } from "lucide-react";
import React from "react";
import { isFeatureEnabled } from "@/lib/feature-flags";

type PageProps = {
  params: Promise<{ secureSlug: string }>;
};

export default async function PublicReportPage({ params }: PageProps) {
  const { secureSlug } = await params;

  const report = await prisma.serviceReport.findUnique({
    where: { secureSlug },
    include: {
      jobCard: {
        include: {
          station: {
            include: {
              branding: true,
              settings: true
            }
          },
          vehicle: true,
          customer: true,
          services: true,
          inspection: true,
          photos: true,
          invoice: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const reportsEnabled = await isFeatureEnabled(report.jobCard.stationId, "reports");
  if (!reportsEnabled) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <div className="bg-white border rounded-xl p-8 max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">
            Feature not enabled for this subscription.
          </p>
        </div>
      </main>
    );
  }

  const job = report.jobCard;
  const station = job.station;
  const b = station.branding || ({} as any);
  const s = station.settings || ({} as any);

  if (report.expiresAt && new Date() > report.expiresAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <div className="bg-white border rounded-xl p-8 max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold text-rose-600">This report has expired.</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            For privacy and data retention policies, this service report has expired. Reports expire 30 days after generation.
          </p>
        </div>
      </main>
    );
  }

  const beforePhotos = job.photos.filter((p) => p.type === "BEFORE").map((p) => p.url);
  const afterPhotos = job.photos.filter((p) => p.type === "AFTER").map((p) => p.url);
  const subtotal = job.services.reduce((sum, s) => sum + Number(s.priceSnapshot), 0);

  return (
    <div
      className="min-h-screen bg-slate-50 py-8 px-4 font-sans"
      style={
        {
          "--primary-color": b.primaryColor || "#0f766e",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-3xl bg-white border rounded-2xl shadow-md overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        
        {/* Print & Download Action */}
        <div className="bg-slate-50 border-b px-6 py-3 flex justify-between items-center print:hidden">
          <span className="text-xs font-bold text-slate-500">Public Service Report</span>
          <div className="flex gap-2">
            {report.pdfUrl && (
              <a
                href={report.pdfUrl}
                download={`service_report_${secureSlug}.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 border bg-white rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-sm text-slate-700 decoration-none"
              >
                <Download size={14} />
                Download PDF
              </a>
            )}
            <a
              href="javascript:window.print()"
              className="flex items-center gap-1.5 px-3 py-1.5 border bg-white rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-sm text-slate-700 decoration-none"
            >
              <Printer size={14} />
              Print Report
            </a>
          </div>
        </div>

        {/* Station Header Branding */}
        <header className="px-8 py-6 bg-[var(--primary-color)]/5 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            {b.squareLogoUrl ? (
              <img
                src={b.squareLogoUrl}
                alt={station.name}
                className="h-12 w-12 object-contain rounded-lg bg-white p-1 border"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-[var(--primary-color)] text-white flex items-center justify-center font-bold text-lg">
                {station.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800">{station.name}</h1>
              {b.businessAddress && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">{b.businessAddress}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} className="text-emerald-600" />
              Verified Report
            </span>
            <p className="text-xs font-mono text-slate-400 mt-1">Ref: {secureSlug.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        {/* Vehicle & Customer Overview Card */}
        <div className="p-8 border-b bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registration</span>
              <span className="text-base font-extrabold text-slate-800 font-mono mt-1 block">
                {job.vehicle.vehicleNumber}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">
                {job.vehicle.brand && job.vehicle.model
                  ? `${job.vehicle.brand} ${job.vehicle.model}`
                  : job.vehicle.vehicleType}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block truncate">
                {job.customer.name}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">
                {new Date(report.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Inspection Snapshot */}
        {job.inspection && (
          <div className="p-8 border-b">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Initial Inspection & Condition
            </h2>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-900 font-medium">
              {job.inspection.notes}
            </div>
          </div>
        )}

        {/* Services Executed */}
        <div className="p-8 border-b">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Services Rendered
          </h2>
          <div className="space-y-3">
            {job.services.map((service, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{service.serviceNameSnapshot}</span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-600">
                  ₹{Number(service.priceSnapshot).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end items-center gap-6 text-sm font-bold">
            <span className="text-slate-400">Total Valuation</span>
            <span className="text-base font-extrabold font-mono text-[var(--primary-color)]">
              ₹{subtotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Photo Documentation Grid */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div className="p-8 border-b space-y-6">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Photographic Proof of Work
            </h2>

            {beforePhotos.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-500 mb-3 block">Before Treatment Snapshot</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {beforePhotos.map((url, i) => (
                    <div key={i} className="aspect-video bg-slate-100 rounded-lg overflow-hidden border">
                      <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-500 mb-3 block">After Treatment Snapshot</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {afterPhotos.map((url, i) => (
                    <div key={i} className="aspect-video bg-slate-100 rounded-lg overflow-hidden border shadow-sm">
                      <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <footer className="p-8 bg-slate-50 text-center space-y-2">
          <p className="text-xs font-bold text-slate-600">
            Certified & Documented by {station.name} Operations Team.
          </p>
          <p className="text-[11px] text-slate-400">
            This digital service report serves as verifiable proof of treatment and condition upon release.
          </p>
        </footer>
      </div>
    </div>
  );
}
