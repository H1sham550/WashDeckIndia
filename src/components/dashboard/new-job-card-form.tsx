"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { VehicleType } from "@prisma/client";
import { compressImage } from "@/lib/image-compressor";
import { useToast } from "@/components/ui/toast";

type ServicePrice = {
  vehicleType: VehicleType;
  price: number;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  prices: ServicePrice[];
};

type TemplateItem = {
  service: {
    id: string;
    name: string;
    prices: ServicePrice[];
  };
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
};

type NewJobCardFormProps = {
  vehicle: {
    id: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    brand: string | null;
    model: string | null;
    color: string | null;
    contacts: Array<{
      customer: {
        name: string;
        mobile: string;
      };
    }>;
  };
  services: Service[];
  templates: Template[];
};

export function NewJobCardForm({ vehicle, services, templates }: NewJobCardFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [etaOffsetHours, setEtaOffsetHours] = useState("1"); // 1 hour default
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState("");

  const primaryContact = vehicle.contacts?.[0]?.customer;

  // Resolve service price for this vehicle's type
  function getServicePriceForVehicle(service: Service) {
    const p = service.prices.find((p) => p.vehicleType === vehicle.vehicleType);
    return p ? p.price : 0;
  }

  // Calculate Running Estimate
  const totalEstimate = selectedServiceIds.reduce((sum, sId) => {
    const s = services.find((serv) => serv.id === sId);
    return sum + (s ? getServicePriceForVehicle(s) : 0);
  }, 0);

  function handleToggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  // Quick Template Selection
  function handleApplyTemplate(template: Template) {
    const templateServiceIds = template.items.map((i) => i.service.id);
    setSelectedServiceIds((prev) => {
      // Merge unique service IDs
      const merged = new Set([...prev, ...templateServiceIds]);
      return Array.from(merged);
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    setError("");

    const uploadPromises = Array.from(files).map(async (file) => {
      const compressed = await compressImage(file, { maxWidth: 1024, quality: 0.75 });
      const data = new FormData();
      data.append("file", compressed);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Upload failed");
      }
      return json.url;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setBeforePhotos((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setError(err.message || "Failed to upload one or more photos.");
    } finally {
      setUploadingPhotos(false);
    }
  }

  function handleRemovePhoto(index: number) {
    setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedServiceIds.length === 0) {
      const msg = "Please select at least one wash service.";
      setError(msg);
      toast.error("Selection Required", msg);
      setStep(1);
      return;
    }

    startTransition(async () => {
      try {
        // Calculate ETA
        const hours = parseFloat(etaOffsetHours) || 1;
        const etaDate = new Date(Date.now() + hours * 60 * 60 * 1000);

        const response = await fetch("/api/job-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            serviceIds: selectedServiceIds,
            inspectionNotes: inspectionNotes.trim() || undefined,
            expectedCompletionTime: etaDate.toISOString(),
            beforePhotos,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to create job card.");
        }

        toast.success("Job Card Created!", `Vehicle ${vehicle.vehicleNumber} intake complete.`);
        router.push("/dashboard");
        router.refresh();
      } catch (err: any) {
        const msg = err.message || "Could not complete intake.";
        setError(msg);
        toast.error("Intake Failed", msg);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Vehicle header summary */}
      <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-lg text-slate-600">
            <Car size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 tracking-wide uppercase">
                {vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-600">
                {vehicle.vehicleType.toLowerCase()}
              </span>
            </div>
            {primaryContact && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Customer: <span className="text-slate-700 font-bold">{primaryContact.name}</span> ({primaryContact.mobile})
              </p>
            )}
          </div>
        </div>
        <div className="text-right sm:border-l sm:pl-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ESTIMATE TOTAL</p>
          <p className="text-xl font-extrabold text-[var(--primary-color)] mt-0.5">₹{totalEstimate}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Services Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quick templates */}
          {templates.length > 0 && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                Quick Templates
              </h3>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleApplyTemplate(t)}
                    className="px-3.5 py-2 border bg-slate-50 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition shadow-sm"
                  >
                    + Apply "{t.name}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services list */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Services</h3>
            <div className="divide-y space-y-3">
              {services.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                const price = getServicePriceForVehicle(s);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => handleToggleService(s.id)}
                    className={`flex items-center justify-between py-3.5 w-full text-left transition-colors border-b last:border-b-0 ${
                      isSelected ? "text-[var(--primary-color)]" : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <Check size={14} />}
                      </div>
                      <div>
                        <span className="font-bold text-sm block">{s.name}</span>
                        {s.description && (
                          <span className="text-xs text-slate-400 mt-1 block font-medium max-w-xl">{s.description}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-slate-800 shrink-0">₹{price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (selectedServiceIds.length === 0) {
                  setError("Please select at least one wash service.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="flex h-11 items-center justify-center gap-1 px-5 rounded-lg text-white text-sm font-bold hover:brightness-95 transition shadow-sm"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Continue to Details
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Details & Inspection */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inspection and ETA */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Job Card Details</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="inspectNotes">Vehicle Inspection Notes</label>
              <textarea
                id="inspectNotes"
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Mention pre-existing scratches, interior state, fuel levels, items left in car, or specific requests..."
                className="w-full h-24 border rounded-lg p-3 text-sm outline-none focus:border-[var(--primary-color)] resize-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="eta">Expected Delivery Time (ETA)</label>
                <div className="relative">
                  <select
                    id="eta"
                    value={etaOffsetHours}
                    onChange={(e) => setEtaOffsetHours(e.target.value)}
                    className="h-10 w-full border rounded-lg pl-3 pr-10 text-sm outline-none focus:border-[var(--primary-color)] bg-white font-medium"
                  >
                    <option value="0.5">30 Minutes</option>
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="8">8 Hours (End of Day)</option>
                    <option value="24">24 Hours (Next Day)</option>
                  </select>
                  <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Before Photos Upload */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Vehicle Intake Photos (Before)</h3>
            <p className="text-[11px] text-slate-400">Upload vehicle conditions prior to servicing for documentation and billing transparency.</p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {beforePhotos.map((url, idx) => (
                <div key={idx} className="h-24 border rounded-lg overflow-hidden bg-slate-50 relative group">
                  <img src={url} alt="Before" className="object-cover h-full w-full" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/80 text-rose-600 border hover:bg-white shadow-sm opacity-90 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {uploadingPhotos ? (
                <div className="h-24 border rounded-lg bg-slate-50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[var(--primary-color)]" size={24} />
                </div>
              ) : (
                <label className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold mt-1.5">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 h-10 border rounded-lg text-xs font-bold hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
              Services List
            </button>
            <button
              type="submit"
              disabled={isPending || uploadingPhotos}
              className="flex h-11 items-center justify-center gap-2 rounded-lg text-white text-sm font-bold px-6 hover:brightness-95 disabled:opacity-50 transition shadow-sm"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving Intake...
                </>
              ) : (
                "Complete Vehicle Intake"
              )}
            </button>
          </footer>
        </form>
      )}
    </div>
  );
}
