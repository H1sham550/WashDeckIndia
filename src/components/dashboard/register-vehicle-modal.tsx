"use client";

import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { VehicleType } from "@prisma/client";

type RegisterVehicleModalProps = {
  onClose: () => void;
  initialVehicleNumber?: string;
};

export function RegisterVehicleModal({ onClose, initialVehicleNumber = "" }: RegisterVehicleModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    vehicleNumber: initialVehicleNumber.toUpperCase().replace(/\s/g, ""),
    vehicleType: VehicleType.HATCHBACK as VehicleType,
    brand: "",
    model: "",
    color: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to register vehicle.");
      }

      router.push(`/dashboard/vehicles/${result.vehicle.id}`);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[var(--primary-color)]" size={18} />
            <h3 className="font-bold text-slate-800">Register Vehicle & Customer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="custName">Customer Name *</label>
                <input
                  id="custName"
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))}
                  placeholder="Amit Kumar"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="custMobile">Mobile Number *</label>
                <input
                  id="custMobile"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.customerMobile}
                  onChange={(e) => setFormData((p) => ({ ...p, customerMobile: e.target.value.replace(/\D/g, "") }))}
                  placeholder="9876543210"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="custEmail">Email Address (Optional)</label>
              <input
                id="custEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData((p) => ({ ...p, customerEmail: e.target.value }))}
                placeholder="customer@example.com"
                className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
              />
            </div>
          </div>

          <hr />

          {/* Vehicle Details */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="vehNumber">Vehicle Registration Number *</label>
                <input
                  id="vehNumber"
                  type="text"
                  required
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, vehicleNumber: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                  placeholder="KA03HA1234"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)] uppercase font-bold tracking-wider"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="vehType">Vehicle Type *</label>
                <select
                  id="vehType"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData((p) => ({ ...p, vehicleType: e.target.value as VehicleType }))}
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)] bg-white font-medium"
                >
                  <option value={VehicleType.BIKE}>Bike</option>
                  <option value={VehicleType.HATCHBACK}>Hatchback</option>
                  <option value={VehicleType.SEDAN}>Sedan</option>
                  <option value={VehicleType.SUV}>SUV</option>
                  <option value={VehicleType.LUXURY}>Luxury</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="vehBrand">Brand (Optional)</label>
                <input
                  id="vehBrand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="Hyundai"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="vehModel">Model (Optional)</label>
                <input
                  id="vehModel"
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                  placeholder="Creta"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="vehColor">Color (Optional)</label>
                <input
                  id="vehColor"
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                  placeholder="White"
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                />
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition hover:brightness-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Registering...
                </>
              ) : (
                "Register and Open Passport"
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
