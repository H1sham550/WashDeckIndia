"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, Plus, Trash2, Edit3, Settings, Check, X, Loader2, ListCollapse } from "lucide-react";
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
  };
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
};

type ServicesPanelProps = {
  services: Service[];
  templates: Template[];
};

export function ServicesPanel({ services: initialServices, templates: initialTemplates }: ServicesPanelProps) {
  const [services, setServices] = useState(initialServices);
  const [templates, setTemplates] = useState(initialTemplates);

  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"services" | "templates">("services");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Service Form State
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrices, setServicePrices] = useState<Record<VehicleType, number>>({
    [VehicleType.BIKE]: 150,
    [VehicleType.HATCHBACK]: 350,
    [VehicleType.SEDAN]: 450,
    [VehicleType.SUV]: 550,
    [VehicleType.LUXURY]: 750,
  });

  // Template Form State
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  function handleOpenAddService() {
    setEditingServiceId(null);
    setServiceName("");
    setServiceDesc("");
    setServicePrices({
      [VehicleType.BIKE]: 150,
      [VehicleType.HATCHBACK]: 350,
      [VehicleType.SEDAN]: 450,
      [VehicleType.SUV]: 550,
      [VehicleType.LUXURY]: 750,
    });
    setError("");
    setSuccess("");
    setShowServiceForm(true);
  }

  function handleOpenEditService(service: Service) {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceDesc(service.description || "");

    const newPrices = { ...servicePrices };
    service.prices.forEach((p) => {
      newPrices[p.vehicleType] = p.price;
    });

    setServicePrices(newPrices);
    setError("");
    setSuccess("");
    setShowServiceForm(true);
  }

  function handlePriceChange(vehicleType: VehicleType, val: string) {
    const num = Math.max(0, parseFloat(val) || 0);
    setServicePrices((prev) => ({ ...prev, [vehicleType]: num }));
  }

  async function handleServiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingServiceId || undefined,
            name: serviceName,
            description: serviceDesc,
            prices: servicePrices,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to save service.");
        }

        const savedService = result.service;
        // Construct pricing object locally to map database layout
        const formattedService: Service = {
          id: savedService.id,
          name: savedService.name,
          description: savedService.description,
          prices: Object.entries(servicePrices).map(([vt, pr]) => ({
            vehicleType: vt as VehicleType,
            price: pr,
          })),
        };

        if (editingServiceId) {
          setServices((prev) => prev.map((s) => (s.id === editingServiceId ? formattedService : s)));
          setSuccess("Service updated successfully!");
        } else {
          setServices((prev) => [...prev, formattedService]);
          setSuccess("Service created successfully!");
        }

        setShowServiceForm(false);
      } catch (err: any) {
        setError(err.message || "Could not save service.");
      }
    });
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Are you sure you want to delete this service? This will not affect historical job cards.")) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to delete service.");
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      setSuccess("Service deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Could not delete service.");
    }
  }

  // Templates
  function toggleServiceSelection(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }

  async function handleTemplateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedServiceIds.length === 0) {
      setError("Please select at least one service for the template.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/services/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateName,
            description: templateDesc,
            serviceIds: selectedServiceIds,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to save template.");
        }

        const savedTemplate = result.template;
        const formattedTemplate: Template = {
          id: savedTemplate.id,
          name: savedTemplate.name,
          description: savedTemplate.description,
          items: selectedServiceIds.map((id) => {
            const serv = services.find((s) => s.id === id);
            return {
              service: {
                id,
                name: serv ? serv.name : "Unknown Service",
              },
            };
          }),
        };

        setTemplates((prev) => [...prev, formattedTemplate]);
        setSuccess("Template created successfully!");

        // Reset
        setTemplateName("");
        setTemplateDesc("");
        setSelectedServiceIds([]);
        setShowTemplateForm(false);
      } catch (err: any) {
        setError(err.message || "Could not save template.");
      }
    });
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/services/templates?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to delete template.");
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSuccess("Template deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Could not delete template.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs bar */}
      <div className="flex justify-between items-center border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "services"
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Services & Prices
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "templates"
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Quick Templates
          </button>
        </div>
        <div className="pb-2">
          {activeTab === "services" ? (
            <button
              onClick={handleOpenAddService}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-white text-xs font-bold px-3 hover:brightness-95 transition shadow-sm"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              <Plus size={14} />
              Add Service
            </button>
          ) : (
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowTemplateForm(true);
              }}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-white text-xs font-bold px-3 hover:brightness-95 transition shadow-sm"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              <Plus size={14} />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Services List View */}
      {activeTab === "services" && !showServiceForm && (
        <div className="grid gap-6 md:grid-cols-2">
          {services.length > 0 ? (
            services.map((s) => (
              <div key={s.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{s.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.description || "No description provided."}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditService(s)}
                      className="p-1.5 text-slate-400 hover:text-[var(--primary-color)] hover:bg-slate-55 border rounded-lg transition"
                      title="Edit Service"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border rounded-lg transition"
                      title="Delete Service"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Price Table Grid */}
                <div className="grid grid-cols-5 gap-1 pt-2 border-t text-center">
                  {[
                    [VehicleType.BIKE, "Bike"],
                    [VehicleType.HATCHBACK, "Hatch"],
                    [VehicleType.SEDAN, "Sedan"],
                    [VehicleType.SUV, "SUV"],
                    [VehicleType.LUXURY, "Luxury"],
                  ].map(([vType, label]) => {
                    const priceObj = s.prices.find((p) => p.vehicleType === vType);
                    return (
                      <div key={vType as string} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label as string}</span>
                        <span className="block text-sm font-extrabold text-slate-700 mt-1">
                          ₹{priceObj ? priceObj.price : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-white border rounded-xl p-8 text-center text-slate-400 text-sm">
              No services registered yet. Click "Add Service" to create your first wash item.
            </div>
          )}
        </div>
      )}

      {/* Service Form Edit/Add */}
      {activeTab === "services" && showServiceForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Settings size={18} className="text-[var(--primary-color)]" />
              {editingServiceId ? "Edit Wash Service" : "Add New Wash Service"}
            </h3>
            <button onClick={() => setShowServiceForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="servName">Service Name</label>
              <input
                id="servName"
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Foam Wash"
                className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="servDesc">Description</label>
              <textarea
                id="servDesc"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Exterior foam cleaning, pressure water spray, tire dressing..."
                className="w-full h-20 border rounded-lg p-3 text-sm outline-none focus:border-[var(--primary-color)] resize-none"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicle-Type Pricing (INR)</h4>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
                {[
                  [VehicleType.BIKE, "Bike"],
                  [VehicleType.HATCHBACK, "Hatchback"],
                  [VehicleType.SEDAN, "Sedan"],
                  [VehicleType.SUV, "SUV"],
                  [VehicleType.LUXURY, "Luxury"],
                ].map(([vt, label]) => (
                  <div key={vt as string} className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500" htmlFor={`price_${vt}`}>{label as string}</label>
                    <input
                      id={`price_${vt}`}
                      type="number"
                      min={0}
                      required
                      value={servicePrices[vt as VehicleType]}
                      onChange={(e) => handlePriceChange(vt as VehicleType, e.target.value)}
                      className="h-9 w-full border rounded-lg px-2 text-sm font-bold text-center outline-none focus:border-[var(--primary-color)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowServiceForm(false)}
                className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex h-9 items-center justify-center gap-2 rounded-lg text-white text-xs font-bold px-4 hover:brightness-95 disabled:opacity-50 transition"
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                {isPending ? <Loader2 className="animate-spin" size={14} /> : "Save Service"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Templates List View */}
      {activeTab === "templates" && !showTemplateForm && (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.length > 0 ? (
            templates.map((t) => (
              <div key={t.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{t.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description || "No description provided."}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border rounded-lg transition"
                      title="Delete Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Service list items in template */}
                  <div className="flex flex-wrap gap-1.5 pt-4">
                    {t.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-50 border px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700">
                        <Check size={12} className="text-emerald-500 shrink-0" />
                        {item.service.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-white border rounded-xl p-8 text-center text-slate-400 text-sm">
              No service templates configured yet. Quick Templates allow selecting multiple packages in one tap during vehicle intake.
            </div>
          )}
        </div>
      )}

      {/* Template Form Add */}
      {activeTab === "templates" && showTemplateForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ListCollapse size={18} className="text-[var(--primary-color)]" />
              Create Quick Service Template
            </h3>
            <button onClick={() => setShowTemplateForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="tempName">Template Name</label>
              <input
                id="tempName"
                type="text"
                required
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Full Spa Detailing"
                className="h-10 w-full border rounded-lg px-3 text-sm outline-none focus:border-[var(--primary-color)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="tempDesc">Description</label>
              <textarea
                id="tempDesc"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Combines Foam wash, interior detaling, and engine bay cleaning at a package rate..."
                className="w-full h-16 border rounded-lg p-3 text-sm outline-none focus:border-[var(--primary-color)] resize-none"
              />
            </div>

            {/* Select services checklist */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Included Services</h4>
              <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
                {services.length > 0 ? (
                  services.map((s) => {
                    const isSelected = selectedServiceIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleServiceSelection(s.id)}
                        className={`flex items-center justify-between p-3 border rounded-lg text-left transition-all ${
                          isSelected
                            ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <span className="block text-xs font-bold text-slate-700">{s.name}</span>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">{s.description || "No description"}</span>
                        </div>
                        <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                          isSelected ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Please register services first before creating templates.</p>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowTemplateForm(false)}
                className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex h-9 items-center justify-center gap-2 rounded-lg text-white text-xs font-bold px-4 hover:brightness-95 disabled:opacity-50 transition"
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                {isPending ? <Loader2 className="animate-spin" size={14} /> : "Create Template"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
