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
  Search,
  Plus,
  Users,
  Eye,
} from "lucide-react";
import { VehicleType } from "@prisma/client";

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

type Vehicle = {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand: string | null;
  model: string | null;
  color: string | null;
  contacts: Array<{
    isPrimary: boolean;
    label: string;
    customer: {
      name: string;
      mobile: string;
    };
  }>;
};

type NewJobIntakeWizardProps = {
  preselectedVehicle: Vehicle | null;
  services: Service[];
  templates: Template[];
  defaultEtaMinutes: number;
};

export function NewJobIntakeWizard({
  preselectedVehicle,
  services,
  templates,
  defaultEtaMinutes,
}: NewJobIntakeWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(preselectedVehicle ? 2 : 1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(preselectedVehicle);

  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

  React.useEffect(() => {
    if (!selectedVehicle?.id) {
      setPassportData(null);
      return;
    }
    setLoadingPassport(true);
    fetch(`/api/vehicles/${selectedVehicle.id}/passport`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPassportData(data);
        }
      })
      .catch((err) => console.error("Error fetching passport:", err))
      .finally(() => setLoadingPassport(false));
  }, [selectedVehicle?.id]);

  const mostRecentJob = passportData?.passport?.vehicle?.jobCards?.[0];

  const frequentlyUsedServices = (() => {
    const counts: Record<string, { id: string; name: string; count: number }> = {};
    passportData?.passport?.vehicle?.jobCards?.forEach((jc: any) => {
      jc.services?.forEach((s: any) => {
        if (!counts[s.serviceId]) {
          counts[s.serviceId] = {
            id: s.serviceId,
            name: s.serviceNameSnapshot,
            count: 0,
          };
        }
        counts[s.serviceId].count += 1;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  // Search & Register Vehicle State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    vehicleNumber: "",
    vehicleType: "SEDAN" as VehicleType,
    brand: "",
    model: "",
    color: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
  });

  // Wizard fields
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // ETA State pre-filled with defaultEtaMinutes
  const defaultEtaDate = new Date(Date.now() + defaultEtaMinutes * 60 * 1000);
  const [etaTime, setEtaTime] = useState(new Date(defaultEtaDate.getTime() - defaultEtaDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16));

  const [error, setError] = useState("");

  const primaryContact = selectedVehicle?.contacts?.find((c) => c.isPrimary)?.customer || selectedVehicle?.contacts?.[0]?.customer;

  // Resolve service price for this vehicle's type
  function getServicePriceForVehicle(service: Service) {
    if (!selectedVehicle) return 0;
    const p = service.prices.find((p) => p.vehicleType === selectedVehicle.vehicleType);
    return p ? p.price : 0;
  }

  // Calculate Running Estimate
  const totalEstimate = selectedServiceIds.reduce((sum, sId) => {
    const s = services.find((serv) => serv.id === sId);
    return sum + (s ? getServicePriceForVehicle(s) : 0);
  }, 0);

  async function searchVehicles(val: string) {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/vehicles?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.ok && data.vehicles) {
        const mapped = data.vehicles.map((v: any) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          vehicleType: v.vehicleType,
          brand: v.brand,
          model: v.model,
          color: v.color,
          contacts: v.contacts.map((c: any) => ({
            isPrimary: c.isPrimary,
            label: c.label || "Owner",
            customer: {
              name: c.customer.name,
              mobile: c.customer.mobile,
            },
          })),
        }));
        setSearchResults(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegisterVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to register vehicle.");
      }

      const newVehicle: Vehicle = {
        id: data.vehicle.id,
        vehicleNumber: data.vehicle.vehicleNumber,
        vehicleType: data.vehicle.vehicleType,
        brand: data.vehicle.brand,
        model: data.vehicle.model,
        color: data.vehicle.color,
        contacts: [
          {
            isPrimary: true,
            label: "Owner",
            customer: {
              name: data.customer.name,
              mobile: data.customer.mobile,
            },
          },
        ],
      };

      setSelectedVehicle(newVehicle);
      setShowRegisterForm(false);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Could not register vehicle.");
    }
  }

  function handleToggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  function handleApplyTemplate(template: Template) {
    const templateServiceIds = template.items.map((i) => i.service.id);
    setSelectedServiceIds((prev) => {
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
      const data = new FormData();
      data.append("file", file);

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

  async function handleCreateJob() {
    setError("");
    if (!selectedVehicle) {
      setStep(1);
      return;
    }
    if (selectedServiceIds.length === 0) {
      setError("Please select at least one wash service.");
      setStep(2);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/job-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: selectedVehicle.id,
            serviceIds: selectedServiceIds,
            inspectionNotes: inspectionNotes.trim() || undefined,
            expectedCompletionTime: new Date(etaTime).toISOString(),
            beforePhotos,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to create job card.");
        }

        router.push(`/dashboard/jobs/${result.jobCard.id}`);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Could not complete intake.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Step Progress Bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          {[
            "Intake Vehicle",
            "Select Services",
            "Inspection",
            "Before Photos",
            "ETA",
            "Create Card",
          ].map((label, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 ${
                step === idx + 1
                  ? "text-[var(--primary-color)]"
                  : step > idx + 1
                  ? "text-teal-600"
                  : ""
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] font-extrabold transition-colors ${
                  step === idx + 1
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                    : step > idx + 1
                    ? "border-teal-600 bg-teal-50 text-teal-600"
                    : "border-slate-200"
                }`}
              >
                {idx + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Search or Register Vehicle */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-base font-bold text-slate-800">Step 1: Intake & Search Vehicle</h2>
            <button
              onClick={() => {
                setError("");
                setShowRegisterForm(!showRegisterForm);
              }}
              className="text-xs font-bold text-[var(--primary-color)] hover:underline flex items-center gap-1"
            >
              {showRegisterForm ? "Search Returning Vehicle" : "+ Register New Vehicle"}
            </button>
          </div>

          {!showRegisterForm ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter vehicle number, contact name, or phone..."
                  value={searchQuery}
                  onChange={(e) => searchVehicles(e.target.value)}
                  className="pl-9 h-10 w-full border rounded-lg text-xs font-semibold outline-none focus:border-[var(--primary-color)]"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3.5">
                    <Loader2 className="animate-spin text-slate-400" size={14} />
                  </div>
                )}
              </div>

              <div className="divide-y border rounded-lg max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((v) => {
                    const primary = v.contacts.find((c) => c.isPrimary)?.customer || v.contacts[0]?.customer;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setStep(2);
                        }}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs font-semibold text-slate-700 transition"
                      >
                        <div>
                          <p className="font-extrabold text-slate-800 uppercase text-sm">
                            {v.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase">
                            {v.brand} {v.model} ({v.vehicleType.toLowerCase()})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{primary?.name || "No customer"}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{primary?.mobile || "—"}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-400 text-xs py-8">
                    {searchQuery ? "No matching vehicles found. Register it above!" : "Search for a vehicle registration number to start."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.vehicleNumber}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                    placeholder="e.g. MH12AB1234"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] uppercase"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Vehicle Type *</label>
                  <select
                    value={registerForm.vehicleType}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, vehicleType: e.target.value as VehicleType }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  >
                    <option value="BIKE">BIKE</option>
                    <option value="HATCHBACK">HATCHBACK</option>
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="LUXURY">LUXURY</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block">Brand (Make)</label>
                  <input
                    type="text"
                    value={registerForm.brand}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Maruti Suzuki"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Model</label>
                  <input
                    type="text"
                    value={registerForm.model}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. Swift"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Color</label>
                  <input
                    type="text"
                    value={registerForm.color}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="e.g. White"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-4 space-y-3">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Primary Contact Details</p>
                <div>
                  <label className="mb-1 block">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.customerName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Amit Patel"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={registerForm.customerMobile}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, customerMobile: e.target.value }))}
                    placeholder="9988776655"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block">Email (Optional)</label>
                  <input
                    type="email"
                    value={registerForm.customerEmail}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="amit@example.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 mt-3 rounded-lg text-white font-bold hover:opacity-95"
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                Register & Select
              </button>
            </form>
          )}
        </div>
      )}

      {/* STEP 2: Select Services */}
      {step === 2 && selectedVehicle && (
        <div className="space-y-6">
          {/* Vehicle info card header */}
          <div className="bg-white border rounded-xl p-4 shadow-sm flex justify-between items-center text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-slate-400" />
              <div>
                <p className="font-extrabold uppercase text-slate-800">
                  {selectedVehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedVehicle.brand} {selectedVehicle.model}</p>
              </div>
            </div>
            <div className="text-right border-l pl-3">
              <p className="text-[10px] text-slate-400 uppercase">RUNNING TOTAL</p>
              <p className="text-lg font-extrabold text-[var(--primary-color)]">₹{totalEstimate}</p>
            </div>
          </div>

          {/* Previous Detailing Activity */}
          {loadingPassport ? (
            <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-center gap-2 text-xs text-slate-400 font-bold">
              <Loader2 className="animate-spin" size={16} />
              Loading vehicle detailing history...
            </div>
          ) : (
            passportData && passportData.passport?.vehicle?.jobCards?.length > 0 && (
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-[var(--primary-color)]" />
                  Previous Detailing Activity
                </h3>
                
                {mostRecentJob && (
                  <div className="border rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700">Most Recent Job</span>
                      <span className="text-slate-400 font-semibold">
                        {new Date(mostRecentJob.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mostRecentJob.services?.map((s: any) => (
                        <span key={s.id} className="text-[10px] bg-white border font-bold text-slate-600 px-2 py-0.5 rounded">
                          {s.serviceNameSnapshot}
                        </span>
                      ))}
                    </div>
                    <div className="pt-2 border-t flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const serviceIds = mostRecentJob.services?.map((s: any) => s.serviceId) || [];
                          setSelectedServiceIds(serviceIds);
                        }}
                        className="text-[10px] font-extrabold text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition flex items-center gap-1 bg-white border border-[var(--primary-color)]/20 px-2.5 py-1 rounded-md animate-in fade-in"
                      >
                        1-Click Reuse Services
                      </button>
                    </div>
                  </div>
                )}

                {frequentlyUsedServices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Frequently Used Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {frequentlyUsedServices.map((fs) => {
                        const isSelected = selectedServiceIds.includes(fs.id);
                        return (
                          <button
                            type="button"
                            key={fs.id}
                            onClick={() => handleToggleService(fs.id)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded transition border ${
                              isSelected
                                ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm"
                                : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "} {fs.name} ({fs.count}x)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Quick templates */}
          {templates.length > 0 && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                Quick Service Templates
              </h3>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleApplyTemplate(t)}
                    className="px-3 py-1.5 border bg-slate-50 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition shadow-sm"
                  >
                    + Apply "{t.name}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services Checklist */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Step 2: Select Services</h3>
            <div className="grid gap-3">
              {services.map((service) => {
                const price = getServicePriceForVehicle(service);
                const isChecked = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => handleToggleService(service.id)}
                    className={`p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                      isChecked
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-5 w-5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isChecked && <Check size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{service.name}</p>
                        {service.description && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap ml-4">
                      ₹{price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="flex h-10 items-center justify-center gap-1 text-slate-600 font-bold text-xs px-4 border rounded-lg hover:bg-slate-50 bg-white transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => {
                if (selectedServiceIds.length === 0) {
                  setError("Please select at least one wash service.");
                  return;
                }
                setError("");
                setStep(3);
              }}
              className="flex h-10 items-center justify-center gap-1 text-white font-bold text-xs px-5 rounded-lg hover:brightness-95 transition"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Inspection Notes */}
      {step === 3 && (
        <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Step 3: Vehicle Inspection Notes</h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Note down pre-existing dents, scratches, missing components, or special client requests.
          </p>
          <textarea
            required
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
            placeholder="Type inspection notes here..."
            className="w-full h-32 border rounded-lg p-3 text-xs outline-none focus:border-[var(--primary-color)]"
          />

          <div className="flex justify-between items-center border-t pt-4">
            <button
              onClick={() => setStep(2)}
              className="flex h-10 items-center justify-center gap-1 text-slate-600 font-bold text-xs px-4 border rounded-lg hover:bg-slate-50 bg-white transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex h-10 items-center justify-center gap-1 text-white font-bold text-xs px-5 rounded-lg hover:brightness-95 transition"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Before Photos */}
      {step === 4 && (
        <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Step 4: Upload Before Photos</h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Capture pre-existing body issues to avoid liability claims.
          </p>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {beforePhotos.map((url, idx) => (
              <div key={idx} className="h-24 border rounded-lg overflow-hidden bg-slate-50 relative group shadow-sm">
                <img src={url} alt="Before" className="object-cover h-full w-full" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition"
                  title="Remove image"
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
                <span className="text-[10px] font-bold mt-1.5">Add Before Photo</span>
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

          <div className="flex justify-between items-center border-t pt-4">
            <button
              onClick={() => setStep(3)}
              className="flex h-10 items-center justify-center gap-1 text-slate-600 font-bold text-xs px-4 border rounded-lg hover:bg-slate-50 bg-white transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex h-10 items-center justify-center gap-1 text-white font-bold text-xs px-5 rounded-lg hover:brightness-95 transition"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: ETA */}
      {step === 5 && (
        <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock size={16} className="text-slate-400" />
            Step 5: Configure Expected Completion Time
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Specify the date and time when the vehicle detailing operations are expected to complete.
          </p>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Expected Completion Time</label>
            <input
              type="datetime-local"
              required
              value={etaTime}
              onChange={(e) => setEtaTime(e.target.value)}
              className="h-11 border rounded-lg px-3 text-xs font-semibold outline-none focus:border-[var(--primary-color)] w-full max-w-sm"
            />
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <button
              onClick={() => setStep(4)}
              className="flex h-10 items-center justify-center gap-1 text-slate-600 font-bold text-xs px-4 border rounded-lg hover:bg-slate-50 bg-white transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(6)}
              className="flex h-10 items-center justify-center gap-1 text-white font-bold text-xs px-5 rounded-lg hover:brightness-95 transition"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Summary Review & Submit */}
      {step === 6 && selectedVehicle && (
        <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Step 6: Review Summary & Create Job</h3>

          <div className="grid gap-6 md:grid-cols-2 text-xs font-semibold text-slate-600">
            {/* Vehicle & Customer info */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Intake</p>
                <p className="font-extrabold text-slate-800 text-sm uppercase">
                  {selectedVehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.vehicleType.toLowerCase()})
                </p>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Contact</p>
                <p className="font-extrabold text-slate-800">{primaryContact?.name || "—"}</p>
                <p className="text-[10px] text-slate-500 font-medium">{primaryContact?.mobile || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Expected Completion Time (ETA)</p>
                <p className="font-extrabold text-slate-800">
                  {new Date(etaTime).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Services selected */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Selected Detailing Services</p>
                <div className="divide-y space-y-1">
                  {selectedServiceIds.map((sId) => {
                    const s = services.find((serv) => serv.id === sId);
                    if (!s) return null;
                    return (
                      <div key={sId} className="flex justify-between items-center py-1 font-semibold text-slate-700 text-[11px]">
                        <span>{s.name}</span>
                        <span className="font-extrabold">₹{getServicePriceForVehicle(s)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2 font-bold text-slate-800 text-xs border-t">
                    <span>ESTIMATE TOTAL</span>
                    <span className="text-sm text-[var(--primary-color)] font-extrabold">₹{totalEstimate}</span>
                  </div>
                </div>
              </div>

              {inspectionNotes && (
                <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Inspection notes</p>
                  <p className="font-medium text-slate-700 italic truncate max-w-xs">{inspectionNotes}</p>
                </div>
              )}

              {beforePhotos.length > 0 && (
                <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Photos Uploaded</p>
                  <p className="font-bold text-slate-700">{beforePhotos.length} before photos attached</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <button
              onClick={() => setStep(5)}
              className="flex h-10 items-center justify-center gap-1 text-slate-600 font-bold text-xs px-4 border rounded-lg hover:bg-slate-50 bg-white transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handleCreateJob}
              disabled={isPending}
              className="flex h-10 items-center justify-center gap-1.5 text-white font-bold text-xs px-6 rounded-lg hover:brightness-95 transition shadow-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {isPending && <Loader2 className="animate-spin" size={14} />}
              Confirm & Start Detailing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
