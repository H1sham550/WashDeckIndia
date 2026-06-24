"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  CreditCard,
  AlertTriangle,
  QrCode,
  DollarSign,
  CheckCircle2,
  X,
  Loader2,
  Car,
  User,
  ArrowRight,
} from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  createdAt: string;
  jobCard: {
    id: string;
    status: string;
    vehicle: {
      id: string;
      vehicleNumber: string;
      vehicleType: string;
      brand: string | null;
      model: string | null;
    };
    customer: {
      name: string;
      mobile: string;
    };
    services: Array<{
      serviceNameSnapshot: string;
      priceSnapshot: number;
    }>;
  };
};

type PaymentsPanelProps = {
  initialInvoices: Invoice[];
  station: {
    upiId: string;
    name: string;
  };
};

export function PaymentsPanel({ initialInvoices, station }: PaymentsPanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [checkoutInvoice, setCheckoutInvoice] = useState<Invoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("CASH");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pendingAmount = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const pendingCount = invoices.length;

  async function handleSettlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutInvoice) return;
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/invoices/${checkoutInvoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: selectedMethod }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to settle payment.");
        }

        setInvoices((prev) => prev.filter((inv) => inv.id !== checkoutInvoice.id));
        setSuccess(`Invoice ${checkoutInvoice.invoiceNumber} paid via ${selectedMethod} and vehicle delivered successfully!`);
        setCheckoutInvoice(null);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      }
    });
  }

  // Generate UPI QR String for checkout modal
  const upiUrl = checkoutInvoice && station.upiId
    ? `upi://pay?pa=${station.upiId}&pn=${encodeURIComponent(station.name)}&am=${checkoutInvoice.finalAmount}&cu=INR&tn=${checkoutInvoice.invoiceNumber}`
    : "";

  const qrImageUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
    : "";

  return (
    <div className="space-y-6">
      {/* Success/Error Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="shrink-0" size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Metrics Strips */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Pending Amount</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">₹{pendingAmount}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <Car size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicles Awaiting Payment</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Services</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 uppercase font-extrabold text-[9px] shrink-0">
                          {inv.jobCard.vehicle.vehicleType.charAt(0)}
                        </div>
                        <div>
                          <span className="uppercase tracking-wide">{inv.jobCard.vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}</span>
                          <span className="block text-[9px] text-slate-400 mt-0.5 uppercase">{inv.jobCard.vehicle.brand} {inv.jobCard.vehicle.model}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{inv.jobCard.customer.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inv.jobCard.customer.mobile}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {inv.jobCard.services.map((s, idx) => (
                          <span key={idx} className="bg-slate-100 border text-[9px] px-1.5 py-0.5 rounded text-slate-600 font-semibold truncate">
                            {s.serviceNameSnapshot}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[var(--primary-color)] text-sm">
                      ₹{inv.finalAmount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/dashboard/jobs/${inv.jobCard.id}`}
                          className="h-8 px-3 rounded-lg border text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 text-[11px] font-bold"
                        >
                          View Detailing
                        </Link>
                        <button
                          onClick={() => {
                            setError("");
                            setSuccess("");
                            setSelectedMethod("CASH");
                            setCheckoutInvoice(inv);
                          }}
                          className="h-8 px-3 rounded-lg text-white text-[11px] font-bold transition flex items-center justify-center gap-1 hover:brightness-95 shadow-sm"
                          style={{ backgroundColor: "var(--primary-color)" }}
                        >
                          Settle & Checkout
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No outstanding payments pending. All detailings are checked out!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKOUT SETTLEMENT MODAL */}
      {checkoutInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Checkout Settlement</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Invoice: {checkoutInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setCheckoutInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
              <div className="bg-slate-50 border rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Total</p>
                  <p className="text-lg font-extrabold text-[var(--primary-color)]">₹{checkoutInvoice.finalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Number</p>
                  <p className="font-extrabold text-slate-800 uppercase">{checkoutInvoice.jobCard.vehicle.vehicleNumber}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["CASH", "Cash"],
                    ["UPI", "UPI QR Code"],
                    ["CARD", "Debit/Credit Card"],
                    ["BANK", "Bank Transfer"],
                  ].map(([method, label]) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`h-11 border rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedMethod === method
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 text-[var(--primary-color)]"
                          : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {method === "UPI" ? <QrCode size={14} /> : <CreditCard size={14} />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI QR Display */}
              {selectedMethod === "UPI" && station.upiId && qrImageUrl && (
                <div className="bg-slate-50 border rounded-xl p-4 flex flex-col items-center justify-center space-y-2.5 max-w-[280px] mx-auto shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Scan QR to pay</p>
                  <img src={qrImageUrl} alt="UPI QR" className="h-36 w-36 object-contain border rounded bg-white p-2" />
                  <p className="text-sm font-extrabold text-[var(--primary-color)]">₹{checkoutInvoice.finalAmount}</p>
                  <p className="text-[9px] text-slate-400 font-medium">UPI: {station.upiId}</p>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCheckoutInvoice(null)}
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
                  Confirm Payment & Deliver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
