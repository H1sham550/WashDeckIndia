"use client";

import React, { useState, useTransition } from "react";
import { formatCurrency, formatRelativeTime } from "@/lib/currency";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Car, 
  User, 
  Phone, 
  Sparkles,
  ChevronRight,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
  Share2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

type Booking = {
  id: string;
  customerName: string;
  mobile: string;
  vehicleNumber: string;
  vehicleType: string;
  serviceName: string;
  scheduledAt: string | Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  createdAt: string | Date;
};

interface BookingsPanelProps {
  initialBookings: Booking[];
  stationId: string;
  stationSlug?: string;
  stationName?: string;
}

export function BookingsPanel({ initialBookings, stationId, stationSlug, stationName }: BookingsPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const slugToUse = stationSlug || stationId;
  const publicLink = typeof window !== "undefined" 
    ? `${window.location.origin}/book/${slugToUse}` 
    : `https://washdeck.vercel.app/book/${slugToUse}`;

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");
  const [serviceName, setServiceName] = useState("Full Body Foam Wash");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [timeStr, setTimeStr] = useState("10:00");
  const [notes, setNotes] = useState("");

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesQuery =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.mobile.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobile || !vehicleNumber) return;

    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);

    startTransition(async () => {
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId,
            customerName,
            mobile,
            vehicleNumber: vehicleNumber.toUpperCase(),
            vehicleType,
            serviceName,
            scheduledAt: scheduledAt.toISOString(),
            notes,
          }),
        });
        if (res.ok) {
          const newB = await res.json();
          setBookings((prev) => [newB, ...prev]);
          setModalOpen(false);
          // reset form
          setCustomerName("");
          setMobile("");
          setVehicleNumber("");
          setNotes("");
        }
      } catch (err) {
        console.error("Failed to create booking", err);
      }
    });
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update booking status", err);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            Advance Appointment Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage advance reservations, assign bay time slots, and prevent peak hour wait overflows.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active-tap"
        >
          <Plus size={16} strokeWidth={2.5} />
          Schedule New Appointment
        </button>
      </div>

      {/* Public Booking Link Banner (Item 10) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-2xl p-5 text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-emerald-500/30">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              <Sparkles size={11} className="text-emerald-400" />
              <span>Online Customer Portal Live</span>
            </span>
          </div>
          <h3 className="text-base font-black text-white tracking-tight">Your Public Appointment Booking Page</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
            Customers can now self-book appointments online. Share this link on your WhatsApp bio, Instagram, Google Maps, or invoice footers:
          </p>
          <div className="mt-2.5 flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 select-all overflow-x-auto">
            <span className="truncate">{publicLink}</span>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-stretch lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(publicLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all"
          >
            {copied ? (
              <>
                <Check size={16} className="text-slate-950" />
                <span>Copied Link!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Public Link</span>
              </>
            )}
          </button>
          <a
            href={`/book/${slugToUse}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            <span>Open Page</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, vehicle number, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Calendar className="mx-auto text-slate-300" size={36} />
            <p className="text-sm font-bold text-slate-600">No appointments found matching this criteria.</p>
            <p className="text-xs text-slate-400">Click "Schedule New Appointment" above to book your first slot.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden md:grid grid-cols-[180px_160px_1fr_150px_130px] gap-4 px-6 py-3 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Appointment Time</span>
              <span>Vehicle Info</span>
              <span>Customer & Service</span>
              <span>Status</span>
              <span className="text-right">Quick Actions</span>
            </div>

            {filteredBookings.map((b) => {
              const dateObj = new Date(b.scheduledAt);
              const dateFormatted = dateObj.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div
                  key={b.id}
                  className="grid grid-cols-1 md:grid-cols-[180px_160px_1fr_150px_130px] gap-3 md:gap-4 px-5 py-4 md:px-6 items-center hover:bg-slate-50/50 transition-colors"
                >
                  {/* Appointment Time */}
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <Clock size={15} className="text-blue-500 flex-shrink-0" />
                      <span>{timeFormatted}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{dateFormatted}</p>
                  </div>

                  {/* Vehicle Info */}
                  <div>
                    <span className="font-extrabold text-xs uppercase tracking-wide bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">
                      {b.vehicleNumber}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                      {b.vehicleType}
                    </p>
                  </div>

                  {/* Customer & Service */}
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{b.customerName}</p>
                    <p className="text-[11px] text-blue-600 font-semibold truncate mt-0.5">{b.serviceName}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Phone size={10} /> {b.mobile}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                    {b.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === "CONFIRMED" && (
                      <Link
                        href={`/dashboard/jobs/new?bookingNumber=${encodeURIComponent(b.vehicleNumber)}`}
                        onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold text-[11px] shadow-xs transition-all flex items-center gap-1"
                      >
                        <span>Check-in → Queue</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                    {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                        className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-[10px] transition-colors"
                        title="Cancel Appointment"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating Booking */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">Schedule New Appointment</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KA-01-EQ-9988"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Category</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Hatchback">Hatchback</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury / Sports</option>
                    <option value="Bike">Two-Wheeler / Bike</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Requested Service</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Full Body Foam Wash + Interior Polish"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any customer preferences..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
