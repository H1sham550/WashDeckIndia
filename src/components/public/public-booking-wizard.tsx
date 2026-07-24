"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronLeft, Check, Loader2, Phone, Clock } from "lucide-react";
import { VehicleTypeSelector } from "@/components/dashboard/vehicle-type-selector";

// ─── Types ───────────────────────────────────────────────────────────────
type ServicePrice = { vehicleType: string; price: number };
type Service = {
  id: string;
  name: string;
  description: string | null;
  prices: ServicePrice[];
};
type StationData = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  primaryColor: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { id: "BIKE", label: "Bike / 2-Wheeler" },
  { id: "HATCHBACK", label: "Hatchback" },
  { id: "SEDAN", label: "Sedan" },
  { id: "SUV", label: "SUV / MUV" },
  { id: "LUXURY", label: "Luxury / Premium" },
];

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
];

const STEPS = [
  "Vehicle Type",
  "Service",
  "Date & Time",
  "Your Details",
];

// ─── Utilities ────────────────────────────────────────────────────────────
function getPriceForType(service: Service, vehicleType: string): number {
  return service.prices.find((p) => p.vehicleType === vehicleType)?.price ?? 0;
}

function slotToHours(slot: string): number {
  const isPM = slot.includes("PM");
  const isNoon = slot.startsWith("12");
  const h = parseInt(slot.split(":")[0], 10);
  if (isPM && !isNoon) return h + 12;
  if (!isPM && isNoon) return 0;
  return h;
}

// ─── Step Indicator ───────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all"
                style={{
                  background: done
                    ? "#16A34A"
                    : active
                    ? "hsl(220 91% 54%)"
                    : "white",
                  borderColor: done
                    ? "#16A34A"
                    : active
                    ? "hsl(220 91% 54%)"
                    : "#CBD5E1",
                  color: done || active ? "white" : "#64748B",
                }}
              >
                {done ? <Check size={13} strokeWidth={2.5} /> : stepNum}
              </div>
              <span
                className="hidden sm:block text-xs mt-1"
                style={{
                  color: active ? "hsl(220 91% 54%)" : "#94A3B8",
                  fontWeight: active ? 500 : 400,
                  fontSize: 10,
                }}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-2"
                style={{
                  background: done ? "#16A34A" : "#E2E8F0",
                  minWidth: 16,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export function PublicBookingWizard({ station, services }: { station: StationData; services: Service[] }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [vehicleType, setVehicleType] = useState("SEDAN");
  // Step 2
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] ?? null);
  // Step 3
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [dateStr, setDateStr] = useState(tomorrow.toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("10:00 AM");
  // Step 4
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const price = selectedService ? getPriceForType(selectedService, vehicleType) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !mobile.trim() || !vehicleNumber.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const hours = slotToHours(timeSlot);
      const scheduledAt = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:00:00`);
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationSlugOrId: station.slug || station.id,
          customerName: name.trim(),
          mobile: mobile.trim(),
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType,
          serviceName: selectedService?.name,
          scheduledAt: scheduledAt.toISOString(),
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setSuccess(data.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="py-12 text-center space-y-4 max-w-md mx-auto px-4">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#DCFCE7" }}
        >
          <Check size={28} strokeWidth={2.5} style={{ color: "#16A34A" }} />
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "#0F172A" }}>
            Appointment Confirmed
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
            We have reserved your slot at <strong>{station.name}</strong>.
          </p>
        </div>

        <div
          className="text-left rounded-lg border p-4 text-sm space-y-2"
          style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
        >
          {[
            ["Name", success.customerName],
            ["Vehicle", success.vehicleNumber],
            ["Service", success.serviceName],
            ["Date & Time", `${dateStr}  ${timeSlot}`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: "#64748B" }}>{label}</span>
              <span className="font-medium" style={{ color: "#0F172A" }}>{val}</span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "#94A3B8" }}>
          Please arrive 5–10 minutes before your slot. Bring your vehicle registration documents.
        </p>

        <button
          onClick={() => { setSuccess(null); setStep(1); setName(""); setMobile(""); setVehicleNumber(""); }}
          className="text-sm font-medium"
          style={{ color: "hsl(220 91% 54%)" }}
        >
          Book another appointment
        </button>
      </div>
    );
  }

  // ── Shared footer button ─────────────────────────────────────────────────
  const FooterBar = ({ onNext, label = "Continue", disabled = false }: { onNext?: () => void; label?: string; disabled?: boolean }) => (
    <div
      className="sticky bottom-0 px-4 py-3 border-t bg-white"
      style={{ borderColor: "#E2E8F0" }}
    >
      <button
        type={onNext ? "button" : "submit"}
        onClick={onNext}
        disabled={disabled}
        className="w-full h-11 rounded flex items-center justify-center gap-2 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          background: "hsl(220 91% 54%)",
          color: "white",
          borderRadius: 8,
        }}
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <span>{label}</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm mb-4"
      style={{ color: "#64748B" }}
    >
      <ChevronLeft size={15} />
      Back
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "white" }}
    >
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          {station.logoUrl ? (
            <img src={station.logoUrl} alt={station.name} className="h-8 w-8 rounded object-contain" />
          ) : (
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-semibold"
              style={{ background: station.primaryColor || "hsl(220 91% 54%)" }}
            >
              {station.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{station.name}</p>
            {station.address && (
              <p className="text-xs" style={{ color: "#64748B" }}>{station.address}</p>
            )}
          </div>
        </div>
        {station.phone && (
          <a
            href={`tel:${station.phone}`}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "hsl(220 91% 54%)" }}
          >
            <Phone size={14} />
            <span className="hidden sm:inline">{station.phone}</span>
          </a>
        )}
      </header>

      {/* Step indicator */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
        <StepIndicator current={step} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">

        {/* STEP 1: Vehicle Type */}
        {step === 1 && (
          <div className="px-4 py-6 max-w-xl mx-auto space-y-4">
            <div>
              <h2 className="text-base font-bold mb-1" style={{ color: "#0F172A" }}>
                Select your vehicle type
              </h2>
              <p className="text-xs mb-3" style={{ color: "#64748B" }}>
                Reference illustrations and categories to pick your car type accurately.
              </p>
            </div>
            
            <VehicleTypeSelector
              value={vehicleType as any}
              onChange={(type) => setVehicleType(type)}
              showDetails={true}
            />

            <FooterBar onNext={() => setStep(2)} />
          </div>
        )}

        {/* STEP 2: Service */}
        {step === 2 && (
          <div className="px-4 py-6 max-w-lg mx-auto">
            <BackButton onClick={() => setStep(1)} />
            <h2 className="text-base font-semibold mb-1" style={{ color: "#0F172A" }}>
              Choose a service
            </h2>
            <p className="text-sm mb-5" style={{ color: "#64748B" }}>
              Prices shown for <strong>{VEHICLE_TYPES.find((v) => v.id === vehicleType)?.label}</strong>.
            </p>
            {services.length === 0 ? (
              <p className="text-sm" style={{ color: "#64748B" }}>No services available.</p>
            ) : (
              <div className="space-y-2">
                {services.map((srv) => {
                  const svcPrice = getPriceForType(srv, vehicleType);
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv)}
                      className="w-full flex items-center justify-between px-4 py-3 border rounded text-left transition-all"
                      style={{
                        borderRadius: 8,
                        borderColor: isSelected ? "hsl(220 91% 54%)" : "#E2E8F0",
                        background: isSelected ? "hsl(214 100% 97%)" : "white",
                      }}
                    >
                      <div>
                        <p className="text-sm" style={{ fontWeight: 500, color: "#0F172A" }}>
                          {srv.name}
                        </p>
                        {srv.description && (
                          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                            {srv.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                          ₹{svcPrice}
                        </span>
                        {isSelected && (
                          <Check size={15} strokeWidth={2.5} style={{ color: "hsl(220 91% 54%)" }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <FooterBar onNext={() => setStep(3)} disabled={!selectedService} />
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div className="px-4 py-6 max-w-lg mx-auto">
            <BackButton onClick={() => setStep(2)} />
            <h2 className="text-base font-semibold mb-5" style={{ color: "#0F172A" }}>
              Select date and time
            </h2>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Date
              </label>
              <input
                type="date"
                value={dateStr}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateStr(e.target.value)}
                className="wd-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#0F172A" }}>
                Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className="py-2.5 text-xs border rounded transition-all"
                    style={{
                      borderRadius: 8,
                      borderColor: timeSlot === slot ? "hsl(220 91% 54%)" : "#E2E8F0",
                      background: timeSlot === slot ? "hsl(214 100% 97%)" : "white",
                      color: timeSlot === slot ? "hsl(220 91% 54%)" : "#0F172A",
                      fontWeight: timeSlot === slot ? 500 : 400,
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <FooterBar onNext={() => setStep(4)} />
          </div>
        )}

        {/* STEP 4: Customer Details */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="px-4 py-6 max-w-lg mx-auto">
            <BackButton onClick={() => setStep(3)} />
            <h2 className="text-base font-semibold mb-5" style={{ color: "#0F172A" }}>
              Your details
            </h2>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded text-sm"
                style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 8 }}
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="wd-label-text">Full name *</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="wd-input"
                />
              </div>

              <div>
                <label className="wd-label-text">WhatsApp mobile *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="wd-input"
                />
              </div>

              <div>
                <label className="wd-label-text">Vehicle registration number *</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA03HA1234"
                  className="wd-input"
                  style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                />
              </div>

              <div>
                <label className="wd-label-text">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  className="wd-input"
                  style={{ height: "auto", paddingTop: 8, paddingBottom: 8 }}
                />
              </div>
            </div>

            {/* Summary */}
            <div
              className="mt-5 rounded p-4 text-sm space-y-2"
              style={{ background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}
            >
              <div className="flex justify-between">
                <span style={{ color: "#64748B" }}>Service</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#64748B" }}>Vehicle</span>
                <span className="font-medium">{VEHICLE_TYPES.find((v) => v.id === vehicleType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#64748B" }}>Date & Time</span>
                <span className="font-medium">{dateStr}  {timeSlot}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-1" style={{ borderColor: "#E2E8F0" }}>
                <span style={{ color: "#64748B" }}>Estimated Price</span>
                <span className="font-semibold">₹{price}</span>
              </div>
            </div>

            <FooterBar label="Confirm Appointment" />
          </form>
        )}
      </div>
    </div>
  );
}
