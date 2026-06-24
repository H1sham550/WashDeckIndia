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
          station: true,
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

  // Check if reports feature is enabled for this station
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

  // Check report expiration
  if (report.expiresAt && new Date() > report.expiresAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <div className="bg-white border rounded-xl p-8 max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold text-rose-600">This report has expired.</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            For privacy and data retention policies, this service report has expired. Reports expire {report.jobCard.station.reportExpiryDays} days after generation.
          </p>
        </div>
      </main>
    );
  }

  const job = report.jobCard;
  const station = job.station;
  const beforePhotos = job.photos.filter((p) => p.type === "BEFORE").map((p) => p.url);
  const afterPhotos = job.photos.filter((p) => p.type === "AFTER").map((p) => p.url);
  const subtotal = job.services.reduce((sum, s) => sum + Number(s.priceSnapshot), 0);

  return (
    <div
      className="min-h-screen bg-slate-50 py-8 px-4 font-sans"
      style={
        {
          "--primary-color": station.primaryColor || "#0f766e",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-3xl bg-white border rounded-2xl shadow-md overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        
        {/* Print & Download Action (Hidden in Print Mode) */}
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
            {station.logoUrl ? (
              <img
                src={station.logoUrl}
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
              {station.address && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">{station.address}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} className="text-emerald-600" />
              Verified Report
            </span>
          </div>
        </header>

        {/* Details & Comparisons */}
        <div className="p-8 space-y-6">
          
          {/* Info cards */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Details</h3>
              <div className="flex items-center gap-3 text-sm">
                <Car className="text-[var(--primary-color)]" size={18} />
                <div>
                  <p className="font-extrabold text-slate-800 tracking-wide uppercase">
                    {job.vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
                    {job.vehicle.vehicleType} • {job.vehicle.brand} {job.vehicle.model}
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Info</h3>
              <div className="flex items-center gap-3 text-sm">
                <User className="text-[var(--primary-color)]" size={18} />
                <div>
                  <p className="font-bold text-slate-800">{job.customer.name}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {job.customer.mobile.slice(0, -4)}XXXX
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Services rendered */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Services Rendered</h3>
            <div className="divide-y text-sm">
              {job.services.map((s) => (
                <div key={s.id} className="flex justify-between py-2 items-center">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    {s.serviceNameSnapshot}
                  </div>
                  <span className="font-extrabold text-slate-800">₹{Number(s.priceSnapshot)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Inspection comments */}
          {job.inspection && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Intake Observations</h3>
              <p className="text-sm text-slate-700 bg-slate-50 border rounded-xl p-4 leading-relaxed font-medium">
                {job.inspection.notes}
              </p>
            </section>
          )}

          {/* Photo comparisons */}
          {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Intake & Delivery Photos</h3>
              
              <div className="space-y-4">
                {beforePhotos.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Before Servicing</h4>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                      {beforePhotos.map((url, idx) => (
                        <div key={idx} className="h-20 border rounded-lg overflow-hidden bg-slate-50">
                          <img src={url} alt="Before" className="object-cover h-full w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {afterPhotos.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">After Servicing</h4>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                      {afterPhotos.map((url, idx) => (
                        <div key={idx} className="h-20 border rounded-lg overflow-hidden bg-slate-50">
                          <img src={url} alt="After" className="object-cover h-full w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Invoice Summary */}
          {job.invoice && (
            <section className="border-t pt-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice Number</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{job.invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Final Amount Paid</p>
                <p className="text-2xl font-extrabold text-[var(--primary-color)] mt-0.5">
                  ₹{Number(job.invoice.finalAmount)}
                </p>
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <footer className="bg-slate-50 px-8 py-4 border-t text-center text-[10px] text-slate-400 font-medium">
          Generated automatically by WashDeck. Expiry:{" "}
          {new Date(report.expiresAt!).toLocaleDateString("en-IN")}.
        </footer>

      </div>
    </div>
  );
}
