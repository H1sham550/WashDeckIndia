"use client";

import React, { useState } from "react";
import { Car, Clock, Calendar, CheckCircle2, MapPin, Sparkles, Phone, ShieldCheck, ArrowRight, Loader2, Award } from "lucide-react";

type ServicePrice = {
  vehicleType: string;
  price: number;
};

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

interface PublicBookingWizardProps {
  station: StationData;
  services: Service[];
}

const VEHICLE_TYPES = [
  { id: "BIKE", label: "Bike / 2-Wheeler", icon: "🏍️" },
  { id: "HATCHBACK", label: "Hatchback", icon: "🚗" },
  { id: "SEDAN", label: "Sedan", icon: "🚙" },
  { id: "SUV", label: "SUV / MUV", icon: "🚐" },
  { id: "LUXURY", label: "Luxury / Premium", icon: "🏎️" },
];

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
];

export function PublicBookingWizard({ station, services }: PublicBookingWizardProps) {
  const primaryColor = station.primaryColor || "#0f766e";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [vehicleType, setVehicleType] = useState<string>("SEDAN");
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] || null);
  
  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [dateStr, setDateStr] = useState<string>(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState<string>("10:00 AM");

  const [customerName, setCustomerName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string>("");

  function getPriceForType(srv: Service, type: string) {
    const p = srv.prices.find((pr) => pr.vehicleType === type);
    return p ? p.price : 0;
  }

  const currentPrice = selectedService ? getPriceForType(selectedService, vehicleType) : 0;

  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName || !mobile || !vehicleNumber || !selectedService) {
      setError("Please fill in your name, mobile, and vehicle registration number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert slot string ("10:00 AM") into hours
      let hours = 10;
      if (timeSlot.includes("PM") && !timeSlot.startsWith("12")) {
        hours = parseInt(timeSlot.split(":")[0], 10) + 12;
      } else if (timeSlot.includes("AM") && timeSlot.startsWith("12")) {
        hours = 0;
      } else {
        hours = parseInt(timeSlot.split(":")[0], 10);
      }

      const scheduledAt = new Date(`${dateStr}T${hours.toString().padStart(2, "0")}:00:00`);

      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationSlugOrId: station.slug || station.id,
          customerName,
          mobile,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          vehicleType,
          serviceName: selectedService.name,
          scheduledAt: scheduledAt.toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      setBookingSuccess(data.booking);
    } catch (err: any) {
      setError(err.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (bookingSuccess) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={44} />
        </div>
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-full mb-2">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Your Slot is Reserved!</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Thank you, <strong className="text-slate-800">{bookingSuccess.customerName}</strong>! We have confirmed your appointment at <strong className="text-slate-800">{station.name}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs font-medium text-slate-600">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 font-bold">Vehicle</span>
            <span className="font-extrabold text-slate-800 uppercase">{bookingSuccess.vehicleNumber} ({bookingSuccess.vehicleType})</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 font-bold">Service</span>
            <span className="font-extrabold text-slate-800">{bookingSuccess.serviceName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-400 font-bold">Scheduled Time</span>
            <span className="font-extrabold text-[var(--primary-color)]">
              {new Date(bookingSuccess.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, {timeSlot}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Mobile Number</span>
            <span className="font-extrabold text-slate-800">{bookingSuccess.mobile}</span>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 text-[11px] text-blue-800 flex items-center gap-2.5 text-left">
          <Clock size={20} className="text-blue-600 shrink-0" />
          <span>
            Please arrive 5-10 minutes prior to your scheduled time slot for express check-in and bay allocation.
          </span>
        </div>

        <button
          onClick={() => {
            setBookingSuccess(null);
            setStep(1);
          }}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-xs tracking-wide shadow-md hover:bg-slate-800 transition-all"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border shadow-sm text-center text-[11px] font-extrabold">
        {[
          [1, "Vehicle Type"],
          [2, "Select Service"],
          [3, "Date & Time"],
          [4, "Your Details"],
        ].map(([sNum, sLabel]) => {
          const isActive = step === sNum;
          const isDone = step > (sNum as number);
          return (
            <div
              key={sNum as number}
              onClick={() => isDone && setStep(sNum as any)}
              className={`py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? "bg-[var(--primary-color)] text-white shadow-sm"
                  : isDone
                    ? "bg-emerald-50 text-emerald-700 cursor-pointer"
                    : "text-slate-400"
              }`}
            >
              <span className="block text-[10px] opacity-80">Step {sNum}</span>
              <span className="truncate">{sLabel}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: VEHICLE TYPE */}
      {step === 1 && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-slate-800">1. What type of vehicle do you have?</h2>
            <p className="text-xs text-slate-400 mt-0.5">We calculate precise service pricing based on your vehicle size and class.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VEHICLE_TYPES.map((v) => {
              const isSelected = vehicleType === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleType(v.id)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all ${
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 text-slate-900 shadow-sm font-extrabold scale-[1.02]"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 font-bold"
                  }`}
                >
                  <span className="text-3xl block">{v.icon}</span>
                  <span className="text-xs">{v.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl bg-[var(--primary-color)] text-white font-extrabold text-xs shadow-md hover:opacity-95 flex items-center gap-2"
            >
              <span>Continue to Services</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SERVICE */}
      {step === 2 && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-slate-800">2. Pick your detailing package</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing exact rates for <strong className="text-slate-700">{vehicleType}</strong>.</p>
          </div>

          <div className="grid gap-3">
            {services.map((srv) => {
              const price = getPriceForType(srv, vehicleType);
              const isSelected = selectedService?.id === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="space-y-1 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">{srv.name}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-[var(--primary-color)]" />}
                    </div>
                    {srv.description && (
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">{srv.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-800">₹{price}</span>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Estimated</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedService}
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-xl bg-[var(--primary-color)] text-white font-extrabold text-xs shadow-md hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
            >
              <span>Choose Slot</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SLOT */}
      {step === 3 && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-slate-800">3. Select Date & Arrival Slot</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose your preferred reservation schedule below.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                Date of Visit *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[var(--primary-color)]"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                Arrival Time Slot *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-xs font-black scale-105"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-xl bg-[var(--primary-color)] text-white font-extrabold text-xs shadow-md hover:opacity-95 flex items-center gap-2"
            >
              <span>Enter Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CUSTOMER DETAILS */}
      {step === 4 && (
        <form onSubmit={handleBookAppointment} className="bg-white border rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-black text-slate-800">4. Your Contact & Vehicle Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your contact information so we can reserve your bay and send WhatsApp updates.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Registration Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. MH12AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Special Notes / Requests (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Need interior vacuuming first, or scratch inspection..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
              />
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 border rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-bold">
              <span>Service & Vehicle</span>
              <span className="text-slate-800 font-extrabold">{selectedService?.name} ({vehicleType})</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-bold">
              <span>Appointment Slot</span>
              <span className="text-slate-800 font-extrabold">{dateStr} at {timeSlot}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2 mt-2 text-slate-800 font-black text-sm">
              <span>Estimated Service Price</span>
              <span className="text-emerald-600 text-base">₹{currentPrice}</span>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-[var(--primary-color)] text-white font-extrabold text-xs shadow-md hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <span>Confirm Instant Booking</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
