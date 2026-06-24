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
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  Check,
  Shield,
  HelpCircle,
  Percent,
  AlertTriangle,
  Edit2,
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    name: initialStation.name,
    phone: initialStation.phone,
    email: initialStation.email,
    address: initialStation.address,
    gstNumber: initialStation.gstNumber,
  });

  // Step 2: Branding State
  const [branding, setBranding] = useState({
    primaryColor: initialStation.primaryColor || "#0f766e",
    logoUrl: initialStation.logoUrl,
    bannerUrl: initialStation.bannerUrl,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Step 3: Payments State
  const [payments, setPayments] = useState({
    upiId: initialStation.upiId,
  });

  // Step 4: Services State
  const [services, setServices] = useState<ServiceInput[]>([
    {
      name: "Basic Water Wash",
      description: "Pressure rinse, soap wash, wheel cleaning, and vacuum detailing.",
      prices: [
        { vehicleType: "BIKE", price: 150 },
        { vehicleType: "HATCHBACK", price: 250 },
        { vehicleType: "SEDAN", price: 350 },
        { vehicleType: "SUV", price: 450 },
        { vehicleType: "LUXURY", price: 600 },
      ],
    },
    {
      name: "Full Foam Detailing",
      description: "Snow foam wash, deep interior shampooing, dashboard dressing, and wax polish.",
      prices: [
        { vehicleType: "BIKE", price: 500 },
        { vehicleType: "HATCHBACK", price: 1200 },
        { vehicleType: "SEDAN", price: 1600 },
        { vehicleType: "SUV", price: 2000 },
        { vehicleType: "LUXURY", price: 2800 },
      ],
    },
  ]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrices, setNewServicePrices] = useState<Record<string, number>>({
    BIKE: 150,
    HATCHBACK: 250,
    SEDAN: 350,
    SUV: 450,
    LUXURY: 600,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Step 5: Loyalty State
  const [loyalty, setLoyalty] = useState({
    vipSpendThreshold: initialStation.vipSpendThreshold,
    vipVisitThreshold: initialStation.vipVisitThreshold,
    createOffer: true,
    offerName: "Loyalty Stamp Rewards",
    offerDesc: "Get a free basic wash after completing 5 detailing wash cards.",
    targetCount: 5,
    rewardDescription: "Free Basic Wash",
  });

  // Step 6: Staff State
  const [staffConfig, setStaffConfig] = useState({
    addStaff: true,
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  // Upload helpers
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "bannerUrl") {
    const file = event.target.files?.[0];
    if (!file) return;

    if (field === "logoUrl") setUploadingLogo(true);
    else setUploadingBanner(true);

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to upload image.");
      }

      setBranding((prev) => ({ ...prev, [field]: result.url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingLogo(false);
      setUploadingBanner(false);
    }
  }

  // Next step handler
  async function handleNextStep() {
    setError("");
    setLoading(true);

    try {
      let response;
      if (step === 1) {
        // Validate
        if (!businessProfile.name) {
          throw new Error("Business Name is required.");
        }
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: 1, ...businessProfile }),
        });
      } else if (step === 2) {
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: 2, ...branding }),
        });
      } else if (step === 3) {
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: 3, ...payments }),
        });
      } else if (step === 4) {
        if (services.length === 0) {
          throw new Error("At least one service is required.");
        }
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: 4, services }),
        });
      } else if (step === 5) {
        const payload: any = {
          step: 5,
          vipSpendThreshold: loyalty.vipSpendThreshold,
          vipVisitThreshold: loyalty.vipVisitThreshold,
        };
        if (loyalty.createOffer) {
          if (!loyalty.offerName || !loyalty.rewardDescription) {
            throw new Error("Offer Name and Reward Description are required.");
          }
          payload.offer = {
            name: loyalty.offerName,
            description: loyalty.offerDesc,
            type: "ALL_VEHICLES",
            targetCount: loyalty.targetCount,
            rewardDescription: loyalty.rewardDescription,
          };
        }
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (step === 6) {
        const payload: any = { step: 6 };
        if (staffConfig.addStaff) {
          if (!staffConfig.name || !staffConfig.email || !staffConfig.password) {
            throw new Error("Staff name, email, and password are required.");
          }
          if (staffConfig.password.length < 6) {
            throw new Error("Staff password must be at least 6 characters.");
          }
          payload.staff = {
            name: staffConfig.name,
            email: staffConfig.email,
            mobile: staffConfig.mobile,
            password: staffConfig.password,
          };
        }
        response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response) {
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Onboarding step save failed.");
        }
      }

      setStep((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // Final launch handler
  async function handleFinishOnboarding() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 7 }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to finalize onboarding.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to complete setup.");
      setLoading(false);
    }
  }

  // Service CRUD helpers
  function addService() {
    if (!newServiceName) {
      alert("Service name is required.");
      return;
    }

    const prices: ServicePriceInput[] = Object.entries(newServicePrices).map(
      ([vehicleType, price]) => ({
        vehicleType: vehicleType as any,
        price: Number(price) || 0,
      })
    );

    const targetService = {
      name: newServiceName,
      description: newServiceDesc,
      prices,
    };

    if (editingIndex !== null) {
      setServices((prev) =>
        prev.map((s, idx) => (idx === editingIndex ? targetService : s))
      );
      setEditingIndex(null);
    } else {
      setServices((prev) => [...prev, targetService]);
    }

    setNewServiceName("");
    setNewServiceDesc("");
    setNewServicePrices({
      BIKE: 150,
      HATCHBACK: 250,
      SEDAN: 350,
      SUV: 450,
      LUXURY: 600,
    });
  }

  function editService(index: number) {
    const service = services[index];
    setNewServiceName(service.name);
    setNewServiceDesc(service.description);
    const pricesObj: Record<string, number> = {};
    service.prices.forEach((p) => {
      pricesObj[p.vehicleType] = p.price;
    });
    setNewServicePrices(pricesObj);
    setEditingIndex(index);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServicePrices({
      BIKE: 150,
      HATCHBACK: 250,
      SEDAN: 350,
      SUV: 450,
      LUXURY: 600,
    });
  }

  function deleteService(index: number) {
    if (editingIndex === index) {
      cancelEdit();
    }
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  const progressPercent = Math.round(((step - 1) / 7) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[680px]">
      {/* 1. Header Progress Bar */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-400 shrink-0" size={20} />
              Setup Wizard
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure your multi-tenant detaling workspace in minutes</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-400">Onboarding Progress:</span>
            <span className="bg-slate-800 text-amber-400 border border-slate-700 text-xs font-extrabold px-2.5 py-1 rounded-lg">
              {progressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6 relative">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(4, progressPercent)}%` }}
          />
        </div>

        {/* Steps Indicators Grid */}
        <div className="grid grid-cols-7 gap-1 mt-4 text-[10px] text-center font-bold tracking-wide select-none">
          {[
            { id: 1, label: "Profile" },
            { id: 2, label: "Branding" },
            { id: 3, label: "UPI" },
            { id: 4, label: "Catalog" },
            { id: 5, label: "Loyalty" },
            { id: 6, label: "Staff" },
            { id: 7, label: "Done" },
          ].map((s) => (
            <div
              key={s.id}
              className={`transition-all duration-300 py-1.5 rounded ${
                step === s.id
                  ? "text-amber-400 bg-slate-800/80 border border-slate-700/50"
                  : step > s.id
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              <span className="hidden sm:inline">
                {s.id}. {s.label}
              </span>
              <span className="sm:hidden">{s.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Error Display */}
      {error && (
        <div className="mx-6 mt-6 flex items-center gap-3 p-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertTriangle className="shrink-0 text-rose-500" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Steps Wizard Body */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Business Profile Settings</h3>
                <p className="text-xs text-slate-400">Define the tenant station name and operational details.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 text-xs">
              <div className="md:col-span-2">
                <label className="font-bold text-slate-600 mb-1 block">Detailing Studio Name *</label>
                <input
                  type="text"
                  value={businessProfile.name}
                  onChange={(e) => setBusinessProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Apex Auto Detailing"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 mb-1 block">Contact Phone Number</label>
                <input
                  type="text"
                  value={businessProfile.phone}
                  onChange={(e) => setBusinessProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 mb-1 block">Contact Email Address</label>
                <input
                  type="email"
                  value={businessProfile.email}
                  onChange={(e) => setBusinessProfile((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. info@apexautocare.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-600 mb-1 block">Studio Address</label>
                <input
                  type="text"
                  value={businessProfile.address}
                  onChange={(e) => setBusinessProfile((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 12, Outer Ring Road, Bangalore"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 mb-1 block">GSTIN / Tax Number (Optional)</label>
                <input
                  type="text"
                  value={businessProfile.gstNumber}
                  onChange={(e) => setBusinessProfile((prev) => ({ ...prev, gstNumber: e.target.value }))}
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Branding & Aesthetics</h3>
                <p className="text-xs text-slate-400">Configure visual themes, colors, and logos.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 text-xs">
              <div className="space-y-5">
                <div>
                  <label className="font-bold text-slate-600 mb-1 block">Brand Primary Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-10 w-14 border rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#0f766e"
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none font-mono text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-600 mb-2 block">Logo Upload</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logoUrl")}
                      className="hidden"
                      id="onboard-logo-file"
                    />
                    <label
                      htmlFor="onboard-logo-file"
                      className="inline-flex h-10 items-center justify-center border rounded-xl px-5 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer font-bold select-none transition border-dashed text-xs"
                    >
                      {uploadingLogo ? "Uploading..." : "Choose File"}
                    </label>
                    {branding.logoUrl && (
                      <div className="h-10 w-10 relative rounded-xl border bg-slate-50 overflow-hidden">
                        <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-600 mb-2 block">Banner Image Upload</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "bannerUrl")}
                      className="hidden"
                      id="onboard-banner-file"
                    />
                    <label
                      htmlFor="onboard-banner-file"
                      className="inline-flex h-10 items-center justify-center border rounded-xl px-5 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer font-bold select-none transition border-dashed text-xs"
                    >
                      {uploadingBanner ? "Uploading..." : "Choose File"}
                    </label>
                    {branding.bannerUrl && (
                      <div className="h-10 w-16 relative rounded-xl border bg-slate-50 overflow-hidden">
                        <img src={branding.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE BRAND PREVIEW */}
              <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between h-[250px] relative overflow-hidden shadow-inner">
                <span className="absolute top-2.5 right-3 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-white border px-2 py-0.5 rounded-full select-none">
                  Live Preview
                </span>

                <div className="space-y-4">
                  {/* Header preview reflecting custom brand color and logo */}
                  <div
                    className="rounded-xl p-3 flex items-center justify-between text-white shadow-md transition-all duration-300"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <div className="flex items-center gap-2">
                      {branding.logoUrl ? (
                        <div className="h-7 w-7 rounded-md bg-white p-0.5 overflow-hidden shrink-0">
                          <img src={branding.logoUrl} alt="Preview Logo" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center font-black text-xs shrink-0 select-none">
                          {businessProfile.name.charAt(0) || "W"}
                        </div>
                      )}
                      <span className="font-extrabold text-xs truncate max-w-[120px]">
                        {businessProfile.name || "Apex Detailing"}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-md select-none">
                      Active Session
                    </span>
                  </div>

                  {/* Banner preview block */}
                  <div className="rounded-xl h-24 border bg-white overflow-hidden relative shadow-sm">
                    {branding.bannerUrl ? (
                      <img src={branding.bannerUrl} alt="Preview Banner" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-200/40 text-[10px] text-slate-400 italic font-semibold select-none">
                        No Banner Configured
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-semibold text-center select-none">
                  The dashboard will apply this branding. Logo and color overrides are fully isolated.
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Direct Payments configuration</h3>
                <p className="text-xs text-slate-400">Configure your UPI ID for direct invoice payment settlement.</p>
              </div>
            </div>

            <div className="max-w-md space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 mb-1 block">UPI Address / VPA ID (For Invoice QR codes)</label>
                <input
                  type="text"
                  value={payments.upiId}
                  onChange={(e) => setPayments({ upiId: e.target.value })}
                  placeholder="e.g. businessname@upi, owner@okaxis"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                  When a job card invoice is generated, a dynamic QR code pre-filled with the billing amount will point to this UPI VPA. Funds settle directly into your bank account.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Service Catalog Setup</h3>
                <p className="text-xs text-slate-400">Define services and set prices for different vehicle types.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_320px] text-xs">
              {/* Added services list */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Configured Catalog ({services.length})</h4>
                <div className="space-y-3.5">
                  {services.map((svc, idx) => (
                    <div key={idx} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition relative">
                      <button
                        type="button"
                        onClick={() => editService(idx)}
                        className={`absolute top-3.5 right-12 h-7 w-7 rounded-md border flex items-center justify-center bg-white transition ${
                          editingIndex === idx
                            ? "text-amber-600 border-amber-300 bg-amber-50"
                            : "text-slate-400 hover:text-slate-700 hover:border-slate-300"
                        }`}
                        title="Edit Service"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteService(idx)}
                        className="absolute top-3.5 right-3.5 h-7 w-7 text-slate-400 hover:text-rose-600 rounded-md border flex items-center justify-center bg-white transition hover:border-rose-250"
                        title="Delete Service"
                      >
                        <Trash2 size={13} />
                      </button>
                      <span className="font-bold text-slate-800 text-sm block tracking-wide">{svc.name}</span>
                      {svc.description && <span className="text-[10px] text-slate-400 block mt-0.5">{svc.description}</span>}
                      <div className="grid grid-cols-5 gap-2 mt-3 select-none text-center">
                        {svc.prices.map((p) => (
                          <div key={p.vehicleType} className="bg-white border rounded-lg p-1.5 shadow-sm">
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">{p.vehicleType}</span>
                            <span className="text-slate-700 font-extrabold text-xs mt-0.5 block">₹{p.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add/Edit service panel */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-700 text-xs border-b pb-1.5 flex items-center gap-1.5">
                    {editingIndex !== null ? (
                      <>
                        <Edit2 size={14} className="text-amber-500" />
                        Edit Service
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Add Custom Service
                      </>
                    )}
                  </h4>
                  <div>
                    <label className="font-bold text-slate-500 mb-1 block">Service Name *</label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. Wheel Polish & Wax"
                      className="w-full px-3 py-1.5 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Service details..."
                      className="w-full px-3 py-1.5 border rounded-lg focus:outline-none h-14 resize-none"
                    />
                  </div>

                  <div className="space-y-2 border-t pt-2">
                    <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider block">Prices per vehicle type</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["BIKE", "HATCHBACK", "SEDAN", "SUV", "LUXURY"].map((vt) => (
                        <div key={vt} className="space-y-0.5">
                          <label className="font-extrabold text-[8px] text-slate-500 tracking-wide block uppercase">{vt}</label>
                          <input
                            type="number"
                            min="0"
                            value={newServicePrices[vt] ?? ""}
                            onChange={(e) =>
                              setNewServicePrices((prev) => ({
                                ...prev,
                                [vt]: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-2 py-1 border rounded-lg focus:outline-none text-xs font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    type="button"
                    onClick={addService}
                    className={`w-full h-9 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99] transition text-white ${
                      editingIndex !== null ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-800 hover:bg-slate-900"
                    }`}
                  >
                    {editingIndex !== null ? "Save Changes" : "Add to Catalog"}
                  </button>
                  {editingIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full h-9 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">VIP & Loyalty Systems</h3>
                <p className="text-xs text-slate-400">Configure client VIP status thresholds and initial loyalty programs.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 text-xs">
              <div className="space-y-5">
                <h4 className="font-extrabold text-slate-700 text-xs border-b pb-1.5">VIP Designation Limits</h4>
                <div>
                  <label className="font-bold text-slate-600 mb-1 block">VIP Visit Threshold (Total complete job cards)</label>
                  <input
                    type="number"
                    min="1"
                    value={loyalty.vipVisitThreshold}
                    onChange={(e) => setLoyalty((prev) => ({ ...prev, vipVisitThreshold: Number(e.target.value) || 5 }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none font-semibold text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Number of service visits a customer must complete to gain VIP tag.</p>
                </div>
                <div>
                  <label className="font-bold text-slate-600 mb-1 block">VIP Spend Threshold (Total platform billing value)</label>
                  <input
                    type="number"
                    min="1"
                    value={loyalty.vipSpendThreshold}
                    onChange={(e) => setLoyalty((prev) => ({ ...prev, vipSpendThreshold: Number(e.target.value) || 10000 }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none font-semibold text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Total invoice volume a customer must clear to gain VIP tag.</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-700 text-xs">First Loyalty Stamp Offer</h4>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={loyalty.createOffer}
                      onChange={(e) => setLoyalty((prev) => ({ ...prev, createOffer: e.target.checked }))}
                      className="rounded border-slate-350 text-slate-800 focus:ring-slate-800 h-4 w-4"
                    />
                  </label>
                </div>

                {loyalty.createOffer && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                    <div>
                      <label className="font-bold text-slate-500 mb-1 block">Offer Name *</label>
                      <input
                        type="text"
                        value={loyalty.offerName}
                        onChange={(e) => setLoyalty((prev) => ({ ...prev, offerName: e.target.value }))}
                        className="w-full px-3 py-1.5 border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-500 mb-1 block">Offer Description</label>
                      <input
                        type="text"
                        value={loyalty.offerDesc}
                        onChange={(e) => setLoyalty((prev) => ({ ...prev, offerDesc: e.target.value }))}
                        className="w-full px-3 py-1.5 border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-500 mb-1 block">Stamp Count (Target)</label>
                        <input
                          type="number"
                          min="1"
                          value={loyalty.targetCount}
                          onChange={(e) => setLoyalty((prev) => ({ ...prev, targetCount: Number(e.target.value) || 5 }))}
                          className="w-full px-3 py-1.5 border rounded-lg focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 mb-1 block">Reward Free Item *</label>
                        <input
                          type="text"
                          value={loyalty.rewardDescription}
                          onChange={(e) => setLoyalty((prev) => ({ ...prev, rewardDescription: e.target.value }))}
                          className="w-full px-3 py-1.5 border rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!loyalty.createOffer && (
                  <div className="text-[10px] text-slate-400 font-semibold italic text-center py-10">
                    You can create custom loyalty campaigns and stamp reward rules later in the dashboard.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Operator Account Setup</h3>
                <p className="text-xs text-slate-400">Initialize staff logins to run detail operations at the center.</p>
              </div>
            </div>

            <div className="max-w-lg border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-700 text-xs">Provision First Detailing Staff</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Let operators start creating job cards immediately.</p>
                </div>
                <input
                  type="checkbox"
                  checked={staffConfig.addStaff}
                  onChange={(e) => setStaffConfig((prev) => ({ ...prev, addStaff: e.target.checked }))}
                  className="rounded border-slate-350 text-slate-800 focus:ring-slate-800 h-4 w-4 select-none cursor-pointer"
                />
              </div>

              {staffConfig.addStaff && (
                <div className="grid gap-4 md:grid-cols-2 text-xs pt-1 animate-in fade-in duration-300">
                  <div>
                    <label className="font-bold text-slate-600 mb-1 block">Staff Full Name *</label>
                    <input
                      type="text"
                      value={staffConfig.name}
                      onChange={(e) => setStaffConfig((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Anil Kumar"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 mb-1 block">Staff Login Email *</label>
                    <input
                      type="email"
                      value={staffConfig.email}
                      onChange={(e) => setStaffConfig((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. anil@apex.com"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 mb-1 block">Mobile Number (Optional)</label>
                    <input
                      type="text"
                      value={staffConfig.mobile}
                      onChange={(e) => setStaffConfig((prev) => ({ ...prev, mobile: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 mb-1 block">Operator Password *</label>
                    <input
                      type="password"
                      value={staffConfig.password}
                      onChange={(e) => setStaffConfig((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {!staffConfig.addStaff && (
                <div className="text-[10px] text-slate-400 font-semibold italic text-center py-8">
                  You can register and manage operator/staff accounts later in the users module.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="text-center py-10 space-y-6 max-w-md mx-auto">
            <div className="inline-flex h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center border border-emerald-100 shadow-md">
              <CheckCircle size={36} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Your workspace is ready!</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Congratulations! We've saved all your business configurations, branding layouts, catalog pricing, and initial crew accounts.
              </p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4 text-left font-semibold text-xs space-y-2.5">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400">Station Name:</span>
                <span className="text-slate-800 font-extrabold">{businessProfile.name}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400">Active Color:</span>
                <span className="font-mono text-slate-800 font-extrabold flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border" style={{ backgroundColor: branding.primaryColor }} />
                  {branding.primaryColor}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400">Payment UPI:</span>
                <span className="text-slate-800 font-extrabold truncate max-w-[180px]">{payments.upiId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crew Accounts:</span>
                <span className="text-slate-800 font-extrabold">1 Owner {staffConfig.addStaff ? "+ 1 Staff" : ""}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Controllers */}
      <div className="bg-slate-50 border-t p-5 flex items-center justify-between shrink-0 select-none">
        {step > 1 && step < 7 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-4 transition disabled:opacity-50"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 7 ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold px-5 transition disabled:opacity-50 shadow-md ml-auto"
          >
            {loading ? (
              "Saving step..."
            ) : (
              <>
                Next Step
                <ArrowRight size={14} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishOnboarding}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 transition disabled:opacity-50 shadow-md shadow-emerald-700/10 w-full md:w-auto"
          >
            {loading ? "Completing Wizard..." : "Launch Workspace Dashboard"}
          </button>
        )}
      </div>
    </div>
  );
}
