"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Palette,
  CreditCard,
  Sparkles,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Shield,
  Percent,
  AlertTriangle,
  ArrowRight,
  Upload,
} from "lucide-react";

type ServicePriceInput = {
  vehicleType: "BIKE" | "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY";
  price: number;
};

type ServiceInput = {
  name: string;
  description: string;
  prices: ServicePriceInput[];
};

type OnboardingWizardProps = {
  initialStation: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    gstNumber: string;
    logoUrl: string;
    bannerUrl: string;
    primaryColor: string;
    upiId: string;
    vipSpendThreshold: number;
    vipVisitThreshold: number;
  };
};

export function OnboardingWizard({ initialStation }: OnboardingWizardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Business Profile
  const [businessProfile, setBusinessProfile] = useState({
    name: initialStation.name,
    phone: initialStation.phone,
    email: initialStation.email,
    address: initialStation.address,
  });

  // Branding
  const [branding, setBranding] = useState({
    primaryColor: initialStation.primaryColor || "#0f766e",
    logoUrl: initialStation.logoUrl,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Payments
  const [payments, setPayments] = useState({
    upiId: initialStation.upiId,
  });

  // Initial Services
  const [services, setServices] = useState<ServiceInput[]>([
    {
      name: "Basic Water Wash",
      description: "Pressure rinse, soap wash, wheel cleaning, and vacuum detailing.",
      prices: [
        { vehicleType: "BIKE", price: 20 },
        { vehicleType: "HATCHBACK", price: 35 },
        { vehicleType: "SEDAN", price: 45 },
        { vehicleType: "SUV", price: 60 },
        { vehicleType: "LUXURY", price: 85 },
      ],
    },
    {
      name: "Full Foam Detailing",
      description: "Snow foam wash, deep interior shampooing, dashboard dressing, and wax polish.",
      prices: [
        { vehicleType: "BIKE", price: 60 },
        { vehicleType: "HATCHBACK", price: 120 },
        { vehicleType: "SEDAN", price: 150 },
        { vehicleType: "SUV", price: 200 },
        { vehicleType: "LUXURY", price: 280 },
      ],
    },
  ]);

  // Loyalty & VIP
  const [loyalty, setLoyalty] = useState({
    vipSpendThreshold: initialStation.vipSpendThreshold || 10000,
    vipVisitThreshold: initialStation.vipVisitThreshold || 5,
    createOffer: false,
    offerName: "First Visit 20% Discount",
    offerDesc: "Get 20% off on your first full wash service",
    rewardDescription: "20% discount on total invoice",
    targetCount: 5,
  });

  // Staff Account
  const [staffConfig, setStaffConfig] = useState({
    addStaff: false,
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Logo upload failed.");
      setBranding((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePriceChange = (serviceIndex: number, vehicleType: string, newPrice: number) => {
    setServices((prev) =>
      prev.map((s, idx) => {
        if (idx !== serviceIndex) return s;
        return {
          ...s,
          prices: s.prices.map((p) => (p.vehicleType === vehicleType ? { ...p, price: newPrice } : p)),
        };
      })
    );
  };

  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      {
        name: "New Detailing Package",
        description: "Custom station wash & treatment package",
        prices: [
          { vehicleType: "BIKE", price: 30 },
          { vehicleType: "HATCHBACK", price: 50 },
          { vehicleType: "SEDAN", price: 70 },
          { vehicleType: "SUV", price: 90 },
          { vehicleType: "LUXURY", price: 120 },
        ],
      },
    ]);
  };

  const handleRemoveService = (idx: number) => {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!businessProfile.name.trim()) {
      setError("Station / Business Name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (staffConfig.addStaff) {
      if (!staffConfig.name || !staffConfig.email || !staffConfig.password) {
        setError("Staff Name, Email/Username, and Password are required when adding a staff account.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFullSubmission: true,
          businessProfile,
          branding,
          payments,
          services,
          loyalty,
          staff: staffConfig.addStaff ? staffConfig : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to save station configuration.");
      }

      // Clean Javascript redirect to dashboard
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building2 size={24} />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
              Single-Page Quick Setup
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Station Onboarding & Configuration
            </h1>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 max-w-xl">
          Set up your station identity, wash services, brand colors, and staff accounts below in one simple scrollable page.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitAll} className="space-y-6">
        {/* SECTION 1: Business Identity & Branding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="text-teal-600" size={20} />
            <h2 className="text-base font-extrabold text-slate-800">1. Business Profile & Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Station Name */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-600">Station / Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Wash Express Auto Spa"
                value={businessProfile.name}
                onChange={(e) => setBusinessProfile((p) => ({ ...p, name: e.target.value }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>

            {/* Business Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Business Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={businessProfile.phone}
                onChange={(e) => setBusinessProfile((p) => ({ ...p, phone: e.target.value }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>

            {/* Business Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Business Email</label>
              <input
                type="email"
                placeholder="info@stationname.com"
                value={businessProfile.email}
                onChange={(e) => setBusinessProfile((p) => ({ ...p, email: e.target.value }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-600">Station Address / Location</label>
              <input
                type="text"
                placeholder="Shop No. 5, MG Road, Bengaluru, Karnataka"
                value={businessProfile.address}
                onChange={(e) => setBusinessProfile((p) => ({ ...p, address: e.target.value }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>

            {/* Brand Color */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))}
                  className="h-11 w-14 border border-slate-200 rounded-xl p-1 cursor-pointer bg-white"
                />
                <span className="text-xs font-mono font-bold text-slate-700">{branding.primaryColor}</span>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Station Logo</label>
              <div className="flex items-center gap-3">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-11 w-11 rounded-xl object-cover border" />
                ) : null}
                <label className="h-11 px-4 border border-slate-200 hover:border-teal-600 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={14} />
                  <span>{uploadingLogo ? "Uploading..." : branding.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Initial Services & Pricing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              <h2 className="text-base font-extrabold text-slate-800">2. Wash Services & Pricing</h2>
            </div>
            <button
              type="button"
              onClick={handleAddService}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
            >
              <Plus size={14} />
              <span>Add Package</span>
            </button>
          </div>

          <div className="space-y-4">
            {services.map((service, sIdx) => (
              <div key={sIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    required
                    value={service.name}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s, i) => (i === sIdx ? { ...s, name: e.target.value } : s))
                      )
                    }
                    className="font-bold text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-teal-600 w-full max-w-xs"
                  />
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveService(sIdx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {service.prices.map((p) => (
                    <div key={p.vehicleType} className="p-2 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        {p.vehicleType}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold text-slate-400">SAR</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={p.price}
                          onChange={(e) =>
                            handlePriceChange(sIdx, p.vehicleType, Number(e.target.value))
                          }
                          className="w-full font-extrabold text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: VIP Loyalty & Thresholds */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="text-purple-600" size={20} />
            <h2 className="text-base font-extrabold text-slate-800">3. VIP Customer Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">VIP Spend Threshold (SAR)</label>
              <input
                type="number"
                value={loyalty.vipSpendThreshold}
                onChange={(e) => setLoyalty((l) => ({ ...l, vipSpendThreshold: Number(e.target.value) }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">VIP Visit Threshold (Visits)</label>
              <input
                type="number"
                value={loyalty.vipVisitThreshold}
                onChange={(e) => setLoyalty((l) => ({ ...l, vipVisitThreshold: Number(e.target.value) }))}
                className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Staff Member Account (Optional) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <h2 className="text-base font-extrabold text-slate-800">4. Initial Staff Member (Optional)</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={staffConfig.addStaff}
                onChange={(e) => setStaffConfig((s) => ({ ...s, addStaff: e.target.checked }))}
                className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-slate-700">Add Staff Account Now</span>
            </label>
          </div>

          {staffConfig.addStaff && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Staff Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Al-Mansoor"
                  value={staffConfig.name}
                  onChange={(e) => setStaffConfig((s) => ({ ...s, name: e.target.value }))}
                  className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Staff Email or Username</label>
                <input
                  type="text"
                  placeholder="tariq@station.com"
                  value={staffConfig.email}
                  onChange={(e) => setStaffConfig((s) => ({ ...s, email: e.target.value }))}
                  className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={staffConfig.password}
                  onChange={(e) => setStaffConfig((s) => ({ ...s, password: e.target.value }))}
                  className="h-11 w-full border border-slate-200 rounded-xl px-3.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            {loading ? (
              <span>Saving Station Details...</span>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Save Configuration & Launch Station Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
