"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Car,
  User,
  Phone,
  Mail,
  Tag,
  Trash2,
  Users,
  ShieldAlert,
  Loader2,
  X,
  UserPlus,
} from "lucide-react";
import { VehicleType } from "@prisma/client";
import { VehicleTypeSelector } from "./vehicle-type-selector";

type Customer = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
};

type ContactLink = {
  id: string;
  isPrimary: boolean;
  label: string;
  customer: Customer;
};

type Vehicle = {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  tags: string[];
  contacts: ContactLink[];
};

type VehiclesDirectoryProps = {
  initialVehicles: Vehicle[];
  userRole: string;
};

export function VehiclesDirectory({ initialVehicles, userRole }: VehiclesDirectoryProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "SEDAN" as VehicleType,
    brand: "",
    model: "",
    color: "",
    customerName: "",
    customerMobile: "",
    customerEmail: "",
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    mobile: "",
    email: "",
    label: "Owner",
    isPrimary: false,
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = userRole === "OWNER";

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length < 2) {
      if (val.trim() === "") {
        setVehicles(initialVehicles);
      }
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/vehicles?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.ok && data.vehicles) {
        // Map matching structure
        const mapped = data.vehicles.map((v: any) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          vehicleType: v.vehicleType,
          brand: v.brand,
          model: v.model,
          color: v.color,
          tags: v.tags || [],
          contacts: v.contacts.map((c: any) => ({
            id: c.id,
            isPrimary: c.isPrimary,
            label: c.label || "Owner",
            customer: {
              id: c.customer.id,
              name: c.customer.name,
              mobile: c.customer.mobile,
              email: c.customer.email,
            },
          })),
        }));
        setVehicles(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to register vehicle.");
        }

        const newVehicle: Vehicle = {
          id: result.vehicle.id,
          vehicleNumber: result.vehicle.vehicleNumber,
          vehicleType: result.vehicle.vehicleType,
          brand: result.vehicle.brand,
          model: result.vehicle.model,
          color: result.vehicle.color,
          tags: [],
          contacts: [
            {
              id: result.vehicle.id + "-contact",
              isPrimary: true,
              label: "Owner",
              customer: {
                id: result.customer.id,
                name: result.customer.name,
                mobile: result.customer.mobile,
                email: result.customer.email,
              },
            },
          ],
        };

        setVehicles((prev) => [newVehicle, ...prev]);
        setSuccess(`Vehicle ${newVehicle.vehicleNumber} and Customer ${result.customer.name} registered successfully!`);
        setRegisterModalOpen(false);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  function openContactsManager(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setContactForm({
      name: "",
      mobile: "",
      email: "",
      label: "Owner",
      isPrimary: false,
    });
    setError("");
    setSuccess("");
    setContactsModalOpen(true);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/vehicles/${selectedVehicle.id}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactForm),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to link contact.");
        }

        // Re-fetch vehicle contacts to refresh state
        const refreshRes = await fetch(`/api/vehicles?q=${encodeURIComponent(selectedVehicle.vehicleNumber)}`);
        const refreshData = await refreshRes.json();
        if (refreshData.ok && refreshData.vehicles && refreshData.vehicles[0]) {
          const match = refreshData.vehicles[0];
          const updatedContacts = match.contacts.map((c: any) => ({
            id: c.id,
            isPrimary: c.isPrimary,
            label: c.label || "Owner",
            customer: {
              id: c.customer.id,
              name: c.customer.name,
              mobile: c.customer.mobile,
              email: c.customer.email,
            },
          }));

          const updatedVehicle = { ...selectedVehicle, contacts: updatedContacts };
          setSelectedVehicle(updatedVehicle);
          setVehicles((prev) => prev.map((v) => (v.id === selectedVehicle.id ? updatedVehicle : v)));
        }

        setSuccess(`Contact linked successfully!`);
        setContactForm({
          name: "",
          mobile: "",
          email: "",
          label: "Driver",
          isPrimary: false,
        });
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  async function handleRemoveContact(customerId: string) {
    if (!selectedVehicle) return;
    if (!confirm("Are you sure you want to unlink this customer contact?")) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/vehicles/${selectedVehicle.id}/contacts?customerId=${customerId}`, {
          method: "DELETE",
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to unlink contact.");
        }

        const nextContacts = selectedVehicle.contacts.filter((c) => c.customer.id !== customerId);
        const updatedVehicle = { ...selectedVehicle, contacts: nextContacts };
        setSelectedVehicle(updatedVehicle);
        setVehicles((prev) => prev.map((v) => (v.id === selectedVehicle.id ? updatedVehicle : v)));
        setSuccess(`Contact unlinked successfully.`);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 border rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Vehicle Number, Contact Name, or Mobile..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 h-10 w-full border rounded-lg text-xs font-semibold outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <Loader2 className="animate-spin text-slate-400" size={14} />
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setFormData({
              vehicleNumber: "",
              vehicleType: "SEDAN",
              brand: "",
              model: "",
              color: "",
              customerName: "",
              customerMobile: "",
              customerEmail: "",
            });
            setRegisterModalOpen(true);
          }}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg text-white text-xs font-bold px-4 hover:brightness-95 transition shadow-sm shrink-0"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          <Plus size={16} />
          Register Vehicle
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.length > 0 ? (
          vehicles.map((v) => {
            const primaryContact = v.contacts.find((c) => c.isPrimary)?.customer || v.contacts[0]?.customer;
            const primaryLabel = v.contacts.find((c) => c.isPrimary)?.label || v.contacts[0]?.label || "Owner";

            return (
              <div key={v.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 tracking-wide uppercase">
                        {v.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        {v.brand ? `${v.brand} ${v.model}` : "Unknown Model"} ({v.vehicleType.toLowerCase()})
                      </p>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {v.color || "No color"}
                    </span>
                  </div>

                  {/* Contact relations summary */}
                  <div className="bg-slate-50 border rounded-lg p-3 space-y-2 text-xs text-slate-600 font-semibold">
                    <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200">
                      <User size={13} className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400">Primary contact ({primaryLabel.toLowerCase()})</p>
                        <p className="font-extrabold text-slate-700 truncate">{primaryContact?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>{primaryContact?.mobile || "—"}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {v.tags && v.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {v.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-bold bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t flex gap-2">
                  <Link
                    href={`/dashboard/vehicles/${v.id}`}
                    className="flex-1 inline-flex h-8 items-center justify-center rounded-lg border border-[var(--primary-color)] text-[var(--primary-color)] text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Open Passport
                  </Link>
                  <button
                    onClick={() => openContactsManager(v)}
                    className="h-8 px-3 rounded-lg border text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 text-xs font-bold"
                  >
                    <Users size={14} />
                    Contacts ({v.contacts.length})
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="sm:col-span-2 lg:col-span-3 bg-white border rounded-xl p-12 text-center text-slate-400 text-sm font-semibold">
            No registered vehicles found.
          </div>
        )}
      </div>

      {/* REGISTER VEHICLE MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Register Vehicle & Customer</h3>
              <button onClick={() => setRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-5 space-y-4 text-xs font-semibold text-slate-600 max-h-[80vh] overflow-y-auto">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1">Vehicle Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                    placeholder="e.g. MH12AB1234"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] uppercase"
                  />
                </div>

                <div className="col-span-2">
                  <VehicleTypeSelector
                    value={formData.vehicleType}
                    onChange={(type) => setFormData((prev) => ({ ...prev, vehicleType: type }))}
                    showDetails={true}
                  />
                </div>

                <div>
                  <label className="mb-1 block">Brand (Make)</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Honda"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. City"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="e.g. Silver"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1 pt-2">Primary Customer Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Amit Patel"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerMobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerMobile: e.target.value }))}
                    placeholder="e.g. 9988776655"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="e.g. amit@example.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPending && <Loader2 className="animate-spin" size={14} />}
                  Register & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CONTACTS MODAL */}
      {contactsModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Vehicle Contacts Mapping</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Vehicle: {selectedVehicle.vehicleNumber}</p>
              </div>
              <button onClick={() => setContactsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x max-h-[75vh] overflow-y-auto">
              {/* Left Column: Link contacts form */}
              <div className="p-5 space-y-4">
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1 flex items-center gap-1">
                  <UserPlus size={14} /> Link New Contact
                </h4>
                {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
                {success && <p className="text-xs text-emerald-600 font-bold">{success}</p>}
                <form onSubmit={handleAddContact} className="space-y-3 text-xs font-semibold text-slate-600">
                  <div>
                    <label className="mb-1 block">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Vikram Driver"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={contactForm.mobile}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, mobile: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block">Email (Optional)</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. driver@example.com"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block">Label *</label>
                      <select
                        value={contactForm.label}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, label: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                      >
                        <option value="Owner">Owner</option>
                        <option value="Driver">Driver</option>
                        <option value="Family Member">Family Member</option>
                        <option value="Corporate Rep">Corporate Rep</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={contactForm.isPrimary}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                        />
                        <span>Set as Primary</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-9 rounded-lg bg-[var(--primary-color)] text-white font-bold hover:opacity-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                  >
                    {isPending && <Loader2 className="animate-spin" size={14} />}
                    Link Contact
                  </button>
                </form>
              </div>

              {/* Right Column: Existing contacts list */}
              <div className="p-5 space-y-4">
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1 flex items-center gap-1">
                  <Users size={14} /> Linked Contacts ({selectedVehicle.contacts.length})
                </h4>
                <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                  {selectedVehicle.contacts.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 border rounded-xl text-xs space-y-2 relative flex flex-col justify-between ${
                        c.isPrimary ? "bg-teal-50/50 border-teal-200" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            c.isPrimary ? "bg-teal-100 border-teal-300 text-teal-800" : "bg-slate-200 border-slate-300 text-slate-700"
                          }`}>
                            {c.label} {c.isPrimary && "• Primary"}
                          </span>
                          <h5 className="font-bold text-slate-800 mt-1">{c.customer.name}</h5>
                        </div>
                        {!c.isPrimary && (
                          <button
                            onClick={() => handleRemoveContact(c.customer.id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded transition"
                            title="Unlink Contact"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                        <p className="flex items-center gap-1"><Phone size={10} /> {c.customer.mobile}</p>
                        {c.customer.email && <p className="flex items-center gap-1"><Mail size={10} /> {c.customer.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
