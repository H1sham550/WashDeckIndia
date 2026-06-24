"use client";

import React, { useState } from "react";
import { Sparkles, Gift, Trash2, Power, Plus, X, Award, CheckCircle, Search, HelpCircle, Loader2 } from "lucide-react";

type Offer = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  targetCount: number;
  rewardDescription: string;
  isActive: boolean;
  rulesJson: any;
  createdAt: string;
};

type SimpleService = {
  id: string;
  name: string;
};

type OffersPanelProps = {
  initialOffers: Offer[];
  services: SimpleService[];
};

export function OffersPanel({ initialOffers, services }: OffersPanelProps) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [modalOpen, setModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({
    name: "",
    description: "",
    targetCount: "4",
    rewardDescription: "",
    type: "ALL_VEHICLES",
    firstN: "50",
    serviceId: "",
    vehicleType: "SEDAN",
  });

  // Selected Vehicles State (for SELECTED_VEHICLES type)
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehicleSearchResults, setVehicleSearchResults] = useState<Array<{ id: string; vehicleNumber: string }>>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Array<{ id: string; vehicleNumber: string }>>([]);
  const [isSearchingVehicles, setIsSearchingVehicles] = useState(false);

  const [pending, setPending] = useState(false);

  async function handleSearchVehicles(val: string) {
    setVehicleSearchQuery(val);
    if (val.trim().length < 2) {
      setVehicleSearchResults([]);
      return;
    }
    setIsSearchingVehicles(true);
    try {
      const res = await fetch(`/api/vehicles?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.ok && data.vehicles) {
        setVehicleSearchResults(data.vehicles.map((v: any) => ({ id: v.id, vehicleNumber: v.vehicleNumber })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingVehicles(false);
    }
  }

  function handleSelectVehicle(vehicle: { id: string; vehicleNumber: string }) {
    if (selectedVehicles.some((v) => v.id === vehicle.id)) return;
    setSelectedVehicles((prev) => [...prev, vehicle]);
    setVehicleSearchQuery("");
    setVehicleSearchResults([]);
  }

  function handleRemoveSelectedVehicle(id: string) {
    setSelectedVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleToggleActive(offerId: string, currentActive: boolean) {
    const nextActive = !currentActive;
    
    // Optimistic UI update
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, isActive: nextActive } : o))
    );

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, isActive: currentActive } : o))
      );
      alert("Failed to toggle offer status.");
    }
  }

  async function handleDelete(offerId: string) {
    if (!confirm("Are you sure you want to delete this loyalty campaign?")) return;

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      alert("Loyalty campaign deleted.");
    } catch {
      alert("Failed to delete loyalty campaign.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const rulesJson: any = {};
    if (newOffer.type === "FIRST_N_VEHICLES") {
      rulesJson.firstN = parseInt(newOffer.firstN, 10);
    } else if (newOffer.type === "SERVICE_BASED") {
      if (!newOffer.serviceId) {
        alert("Please select a service for service-based offer.");
        setPending(false);
        return;
      }
      rulesJson.serviceId = newOffer.serviceId;
    } else if (newOffer.type === "VEHICLE_TYPE_BASED") {
      rulesJson.vehicleType = newOffer.vehicleType;
    }

    const payload = {
      name: newOffer.name,
      description: newOffer.description,
      targetCount: newOffer.targetCount,
      rewardDescription: newOffer.rewardDescription,
      type: newOffer.type,
      rulesJson: Object.keys(rulesJson).length > 0 ? rulesJson : undefined,
      selectedVehicleIds: newOffer.type === "SELECTED_VEHICLES" ? selectedVehicles.map((v) => v.id) : undefined,
    };

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create offer.");
      }

      const data = await res.json();
      if (data.ok && data.offer) {
        const serialized = {
          ...data.offer,
          createdAt: new Date(data.offer.createdAt).toISOString(),
        };
        setOffers((prev) => [serialized, ...prev]);
        setModalOpen(false);
        // Reset form
        setNewOffer({
          name: "",
          description: "",
          targetCount: "4",
          rewardDescription: "",
          type: "ALL_VEHICLES",
          firstN: "50",
          serviceId: "",
          vehicleType: "SEDAN",
        });
        setSelectedVehicles([]);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPending(false);
    }
  }

  function getOfferTypeLabel(type: string, rules: any) {
    switch (type) {
      case "ALL_VEHICLES":
        return "All Vehicles";
      case "SELECTED_VEHICLES":
        return "Selected Vehicles Only";
      case "FIRST_N_VEHICLES":
        return `First ${rules?.firstN || 50} Vehicles`;
      case "SERVICE_BASED":
        const s = services.find((serv) => serv.id === rules?.serviceId);
        return `Service: ${s?.name || "Selected Service"}`;
      case "VEHICLE_TYPE_BASED":
        return `Vehicle Type: ${rules?.vehicleType || "Selected Type"}`;
      default:
        return type;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and create button */}
      <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Gift className="text-[var(--primary-color)]" size={18} />
            Loyalty Stamps Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Define stamp thresholds for customers to earn complimentary washes.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-color)] hover:opacity-95 text-white text-xs font-bold px-4 transition shadow-sm"
        >
          <Plus size={16} />
          Create Offer
        </button>
      </div>

      {/* Grid List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {offers.length > 0 ? (
          offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${
                !offer.isActive ? "bg-slate-50/50 opacity-80" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">{offer.name}</h3>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Threshold: {offer.targetCount} stamps • {getOfferTypeLabel(offer.type, offer.rulesJson)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    offer.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {offer.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                {offer.description && (
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{offer.description}</p>
                )}

                <div className="bg-slate-50 border rounded-lg p-3 text-xs font-semibold flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>Reward:</span>
                  </div>
                  <span className="font-extrabold text-slate-800">{offer.rewardDescription}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 font-medium">
                  Launched {new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(offer.id, offer.isActive)}
                    title={offer.isActive ? "Pause Offer" : "Resume Offer"}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all bg-white ${
                      offer.isActive
                        ? "text-slate-400 hover:text-amber-600 hover:border-amber-600"
                        : "text-[var(--primary-color)] border-[var(--primary-color)] hover:bg-slate-50"
                    }`}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    title="End Offer"
                    className="h-8 w-8 rounded-lg border text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all bg-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="sm:col-span-2 bg-white border rounded-xl p-12 text-center text-slate-400 text-sm font-semibold">
            No active loyalty stamp campaigns launched yet. Click "Create Offer" to start!
          </div>
        )}
      </div>

      {/* CREATE OFFER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Create Stamp Campaign</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-600 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="mb-1 block">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newOffer.name}
                  onChange={(e) => setNewOffer((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 5th Wash Free"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div>
                <label className="mb-1 block">Description</label>
                <textarea
                  value={newOffer.description}
                  onChange={(e) => setNewOffer((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Complete 4 body washes to get the 5th body wash complimentary."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block">Stamps Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newOffer.targetCount}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, targetCount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block">Reward Description *</label>
                  <input
                    type="text"
                    required
                    value={newOffer.rewardDescription}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, rewardDescription: e.target.value }))}
                    placeholder="e.g. Free Full Detailing"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block">Campaign Eligibility Type *</label>
                <select
                  value={newOffer.type}
                  onChange={(e) => setNewOffer((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-white"
                >
                  <option value="ALL_VEHICLES">ALL_VEHICLES (All returning cars)</option>
                  <option value="SELECTED_VEHICLES">SELECTED_VEHICLES (Targeted select list)</option>
                  <option value="FIRST_N_VEHICLES">FIRST_N_VEHICLES (Limited to first N cars)</option>
                  <option value="SERVICE_BASED">SERVICE_BASED (Required Detailing item)</option>
                  <option value="VEHICLE_TYPE_BASED">VEHICLE_TYPE_BASED (Target specific car size/type)</option>
                </select>
              </div>

              {/* Conditional rules inputs */}
              {newOffer.type === "FIRST_N_VEHICLES" && (
                <div>
                  <label className="mb-1 block">Limit to First N Vehicles *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newOffer.firstN}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, firstN: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This loyalty campaign will only register stamps for the first {newOffer.firstN} distinct vehicles that visit.</p>
                </div>
              )}

              {newOffer.type === "SERVICE_BASED" && (
                <div>
                  <label className="mb-1 block">Triggering Service *</label>
                  <select
                    value={newOffer.serviceId}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-white"
                  >
                    <option value="">-- Choose Wash/Detailing Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Stamps will only increment if the paid checkout contains this specific service.</p>
                </div>
              )}

              {newOffer.type === "VEHICLE_TYPE_BASED" && (
                <div>
                  <label className="mb-1 block">Target Vehicle Type *</label>
                  <select
                    value={newOffer.vehicleType}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-white uppercase"
                  >
                    <option value="BIKE">BIKE</option>
                    <option value="HATCHBACK">HATCHBACK</option>
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="LUXURY">LUXURY</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Stamps will only increment for vehicles of this specific type.</p>
                </div>
              )}

              {newOffer.type === "SELECTED_VEHICLES" && (
                <div className="space-y-3 border p-3 rounded-lg bg-slate-50/50">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search & Add Targeted Vehicles</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type registration number..."
                      value={vehicleSearchQuery}
                      onChange={(e) => handleSearchVehicles(e.target.value)}
                      className="pl-8 h-8 w-full border rounded-lg text-xs font-semibold outline-none focus:border-[var(--primary-color)]"
                    />
                    {isSearchingVehicles && (
                      <div className="absolute right-2.5 top-2.5">
                        <Loader2 className="animate-spin text-slate-400" size={12} />
                      </div>
                    )}
                  </div>

                  {/* Search results */}
                  {vehicleSearchResults.length > 0 && (
                    <div className="border bg-white rounded-lg divide-y max-h-28 overflow-y-auto shadow-sm">
                      {vehicleSearchResults.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => handleSelectVehicle(v)}
                          className="p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between"
                        >
                          <span className="uppercase">{v.vehicleNumber}</span>
                          <span className="text-[10px] text-[var(--primary-color)]">+ Add</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected vehicles list */}
                  {selectedVehicles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] text-slate-400">Targeted Cars ({selectedVehicles.length}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVehicles.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-white border rounded px-1.5 py-0.5"
                          >
                            <span className="uppercase text-slate-700">{v.vehicleNumber}</span>
                            <button type="button" onClick={() => handleRemoveSelectedVehicle(v.id)} className="text-slate-400 hover:text-rose-600 ml-0.5">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {pending && <Loader2 className="animate-spin" size={14} />}
                  Launch Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
