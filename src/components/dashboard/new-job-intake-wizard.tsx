"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  User,
  Check,
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
  Zap,
  FileText,
  Phone,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { VehicleType } from "@prisma/client";
import { VehicleTypeSelector } from "./vehicle-type-selector";
import { VehicleBrandInput } from "./vehicle-brand-input";
import { useToast } from "@/components/ui/toast";
import { compressImageFile } from "@/lib/image-compressor";

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
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  // Vehicle Selection / Search State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(preselectedVehicle);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [searchingVehicles, setSearchingVehicles] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // New Vehicle Inputs
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("SEDAN");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");

  // Services & Intake Details State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // ETA State
  const [etaTime, setEtaTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + (defaultEtaMinutes || 45));
    return d.toISOString().slice(0, 16);
  });

  const [error, setError] = useState("");

  // Populate Customer Data when Vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      const primaryContact = selectedVehicle.contacts?.find((c) => c.isPrimary) || selectedVehicle.contacts?.[0];
      if (primaryContact?.customer) {
        setCustomerName(primaryContact.customer.name);
        setCustomerMobile(primaryContact.customer.mobile);
      }
    }
  }, [selectedVehicle]);

  // Debounced Vehicle Search
  useEffect(() => {
    if (!vehicleSearchQuery || vehicleSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchingVehicles(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingVehicles(true);
      try {
        const res = await fetch(`/api/vehicles?search=${encodeURIComponent(vehicleSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.vehicles || []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Failed to search vehicles:", err);
      } finally {
        setSearchingVehicles(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [vehicleSearchQuery]);

  // Helper to calculate price of a service for current vehicle type
  const activeVehicleType = selectedVehicle ? selectedVehicle.vehicleType : newVehicleType;

  const getServicePriceForVehicle = (service: Service): number => {
    const found = service.prices?.find((p) => p.vehicleType === activeVehicleType);
    return found ? Number(found.price) : 0;
  };

  // Live Total Estimate Calculation
  const totalEstimate = selectedServiceIds.reduce((sum, sId) => {
    const s = services.find((serv) => serv.id === sId);
    if (!s) return sum;
    return sum + getServicePriceForVehicle(s);
  }, 0);

  // Template Quick Selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    const serviceIds = template.items.map((i) => i.service.id);
    setSelectedServiceIds(serviceIds);
  };

  // Toggle Service Checkbox
  const handleToggleService = (sId: string) => {
    setSelectedTemplateId(null);
    setSelectedServiceIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressedFile = await compressImageFile(files[i]);
        const formData = new FormData();
        formData.append("file", compressedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        }
      }
      setBeforePhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Final Single Page Form Submission
  const handleCreateJob = async () => {
    setError("");

    // Validation
    if (!selectedVehicle && (!newVehicleNumber.trim() || !customerName.trim() || !customerMobile.trim())) {
      const msg = "Please select an existing vehicle or enter License Plate, Owner Name, and Mobile Number.";
      setError(msg);
      toast.error("Information Missing", msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (selectedServiceIds.length === 0) {
      const msg = "Please select at least one wash service or package.";
      setError(msg);
      toast.error("No Services Selected", msg);
      return;
    }

    startTransition(async () => {
      try {
        let vehicleIdToUse = selectedVehicle?.id;

        // Create new vehicle if creating fresh intake
        if (!vehicleIdToUse) {
          const createRes = await fetch("/api/vehicles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleNumber: newVehicleNumber.trim().toUpperCase().replace(/\s/g, ""),
              vehicleType: newVehicleType,
              brand: newBrand.trim() || null,
              model: newModel.trim() || null,
              color: newColor.trim() || null,
              customerName: customerName.trim(),
              customerMobile: customerMobile.trim().replace(/\D/g, ""),
            }),
          });

          const createText = await createRes.text();
          let createData: any = {};
          try {
            createData = createText ? JSON.parse(createText) : {};
          } catch {
            throw new Error(createText || `Vehicle registration failed (HTTP ${createRes.status})`);
          }

          if (!createRes.ok || !createData.ok) {
            throw new Error(createData.error || "Failed to register new vehicle.");
          }
          vehicleIdToUse = createData.vehicle?.id;
        }

        // Create Job Card
        const jobRes = await fetch("/api/job-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicleIdToUse,
            serviceIds: selectedServiceIds,
            inspectionNotes: inspectionNotes.trim() || null,
            beforePhotos,
            expectedCompletionTime: etaTime ? new Date(etaTime).toISOString() : null,
            estimatedCompletionTime: etaTime ? new Date(etaTime).toISOString() : null,
          }),
        });

        const jobText = await jobRes.text();
        let jobData: any = {};
        try {
          jobData = jobText ? JSON.parse(jobText) : {};
        } catch {
          throw new Error(jobText || `Job card creation failed (HTTP ${jobRes.status})`);
        }

        if (!jobRes.ok || !jobData.ok) {
          throw new Error(jobData.error || "Failed to create job card.");
        }

        toast.success("Job Card Created Successfully!", `Vehicle ${newVehicleNumber || selectedVehicle?.vehicleNumber} registered & intake opened.`);
        router.push(`/dashboard/jobs/${jobData.jobCard.id}`);
      } catch (err: any) {
        const msg = err.message || "Failed to create job card.";
        setError(msg);
        toast.error("Registration Error", msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-44 md:pb-28">
      {/* Header Banner */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">New Job Card Intake</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-wider">
              Single-Page Express Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Fill in vehicle info, select services, and create job card in one fast scrollable page.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── SECTION 1: VEHICLE & CUSTOMER INFORMATION ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Car size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. Vehicle & Customer Details</h2>
            <p className="text-[11px] text-slate-400 font-medium">Search existing vehicle passport or enter new customer details</p>
          </div>
        </div>

        {/* Search Existing Vehicle */}
        <div className="space-y-2 relative">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Search Vehicle by License Plate / Phone</label>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Type License Plate (e.g. 1234 ABC) or Customer Mobile..."
              value={vehicleSearchQuery}
              onChange={(e) => setVehicleSearchQuery(e.target.value)}
              className="h-11 w-full pl-10 pr-3.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 bg-slate-50/50"
            />
            {searchingVehicles && (
              <Loader2 size={16} className="absolute right-3.5 top-3.5 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((v) => {
                const primary = v.contacts?.find((c) => c.isPrimary) || v.contacts?.[0];
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setShowSearchDropdown(false);
                      setVehicleSearchQuery("");
                    }}
                    className="p-3 hover:bg-teal-50/60 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-xs text-slate-900 uppercase">{v.vehicleNumber}</span>
                      <span className="text-[11px] text-slate-500 font-medium ml-2">
                        {v.brand} {v.model} ({v.vehicleType})
                      </span>
                      {primary?.customer && (
                        <p className="text-[11px] text-slate-400">{primary.customer.name} • {primary.customer.mobile}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-teal-700">Select Vehicle →</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Vehicle Badge or New Vehicle Form */}
        {selectedVehicle ? (
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black">
                <Car size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    {selectedVehicle.vehicleNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                    {selectedVehicle.vehicleType}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.color ? `• ${selectedVehicle.color}` : ""}
                </p>
                {customerName && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Owner: <strong className="text-slate-800">{customerName}</strong> ({customerMobile})
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedVehicle(null);
                setCustomerName("");
                setCustomerMobile("");
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-white transition"
            >
              Change Vehicle
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Or Register New Vehicle Intake</p>
            
            <VehicleTypeSelector
              value={newVehicleType}
              onChange={(type) => setNewVehicleType(type)}
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">License Plate Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. MH12AB1234"
                value={newVehicleNumber}
                onChange={(e) => setNewVehicleNumber(e.target.value)}
                className="h-11 w-full px-3 border border-slate-300 rounded-xl text-xs font-black uppercase text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div className="pt-1 space-y-3">
              <VehicleBrandInput
                value={newBrand}
                onChange={(brand) => setNewBrand(brand)}
                label="Brand / Make (Optional)"
                placeholder="e.g. Maruti Suzuki, Hyundai, Tata, Mahindra"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Model (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Swift, Creta, Nexon"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="h-11 w-full px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Color (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Pearl White, Black"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-11 w-full px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Al-Fahad"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11 w-full px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="h-11 w-full px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: DETAILING & WASH SERVICES SELECTION ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. Detailing & Wash Services</h2>
              <p className="text-[11px] text-slate-400 font-medium">Select wash package templates or check individual services</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {selectedServiceIds.length} Selected
          </span>
        </div>

        {/* Quick Package Templates */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Quick Package Templates</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 block">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-400">{tmpl.items.length} Included Services</span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-teal-700 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Services Checkboxes Grid */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Individual Services & Add-ons</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
              const isChecked = selectedServiceIds.includes(service.id);
              const price = getServicePriceForVehicle(service);
              return (
                <div
                  key={service.id}
                  onClick={() => handleToggleService(service.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isChecked
                      ? "border-teal-700 bg-teal-50/60 ring-1 ring-teal-700/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">{service.name}</span>
                      {service.description && (
                        <span className="text-[10px] text-slate-400 line-clamp-1">{service.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-xs text-slate-900 shrink-0 ml-2">₹{price}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: EXPECTED COMPLETION TIME & INSPECTION ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">3. Completion Time & Inspection Notes</h2>
            <p className="text-[11px] text-slate-400 font-medium">Set target completion ETA and record pre-existing damage notes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Target Completion Date & Time (ETA)</label>
            <input
              type="datetime-local"
              required
              value={etaTime}
              onChange={(e) => setEtaTime(e.target.value)}
              className="h-11 border border-slate-300 rounded-xl px-3 text-xs font-semibold outline-none focus:border-teal-700 w-full bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Quick Inspection Damage Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Scratch on Body",
                "Minor Dent",
                "Paint Damage",
                "No Visible Damage",
              ].map((tag) => {
                const isIncluded = inspectionNotes.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isIncluded) {
                        setInspectionNotes((prev) => prev.replace(`[✓ ${tag}]`, "").trim());
                      } else {
                        setInspectionNotes((prev) => (prev ? `${prev}\n[✓ ${tag}]` : `[✓ ${tag}]`));
                      }
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      isIncluded
                        ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {isIncluded ? "✓ " : "+ "}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Additional Inspection Notes & Special Client Requests</label>
          <textarea
            rows={2}
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
            placeholder="e.g. Client requested extra interior vacuum and leather conditioner..."
            className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium outline-none focus:border-teal-700 bg-slate-50/50 resize-none"
          />
        </div>
      </div>

      {/* ── SECTION 4: BEFORE PHOTOS (OPTIONAL) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Camera size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">4. Before Photos (Optional)</h2>
            <p className="text-[11px] text-slate-400 font-medium">Attach vehicle intake photos for record</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {beforePhotos.map((url, idx) => (
            <div key={idx} className="h-24 border rounded-xl overflow-hidden bg-slate-50 relative group shadow-xs">
              <img src={url} alt="Before" className="object-cover h-full w-full" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {uploadingPhotos ? (
            <div className="h-24 border rounded-xl bg-slate-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-teal-700" size={24} />
            </div>
          ) : (
            <label className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
              <Camera size={22} />
              <span className="text-[10px] font-bold mt-1">Upload Photo</span>
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

      {/* ── STICKY FOOTER ACTION BAR (Elevated above mobile bottom nav) ── */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 p-3.5 sm:p-4 shadow-2xl z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Job Estimate</span>
            <span className="text-xl font-black text-slate-900">₹{totalEstimate}</span>
          </div>

          <button
            type="button"
            onClick={handleCreateJob}
            disabled={isPending}
            className="h-11 sm:h-12 px-6 sm:px-8 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition active-tap"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Creating Job...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Confirm & Create Job Card</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
