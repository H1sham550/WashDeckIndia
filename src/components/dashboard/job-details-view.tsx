"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  User,
  Phone,
  Clock,
  Sparkles,
  Camera,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  X,
  CreditCard,
  QrCode,
  FileText,
  DollarSign,
} from "lucide-react";
import { JobStatus, PaymentMethod } from "@prisma/client";

type JobDetailsViewProps = {
  job: {
    id: string;
    vehicleId: string;
    customerId: string;
    status: JobStatus;
    cancellationReason: string | null;
    cancellationNotes: string | null;
    expectedCompletionTime: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    vehicle: {
      vehicleNumber: string;
      vehicleType: string;
      brand: string | null;
      model: string | null;
      color: string | null;
    };
    customer: {
      name: string;
      mobile: string;
    };
    services: Array<{
      id: string;
      serviceNameSnapshot: string;
      priceSnapshot: number;
    }>;
    inspection: {
      notes: string;
    } | null;
    photos: Array<{
      url: string;
      type: string; // "BEFORE" or "AFTER"
    }>;
    invoice: {
      id: string;
      invoiceNumber: string;
      subtotal: number;
      discount: number;
      finalAmount: number;
      paymentStatus: string; // "PENDING" or "PAID"
      paymentMethod: PaymentMethod | null;
    } | null;
  };
  station: {
    name: string;
    logoUrl: string;
    upiId: string;
    primaryColor: string;
    serviceCompletedTemplate?: string | null;
    paymentReminderTemplate?: string | null;
  };
};

export function JobDetailsView({ job: initialJob, station }: JobDetailsViewProps) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sharing, setSharing] = useState(false);

  async function handleWhatsAppShare() {
    setSharing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/job-cards/${job.id}/report`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to generate report link.");
      }

      const reportLink = `${window.location.origin}/reports/${result.report.secureSlug}`;
      const amountVal = job.invoice ? `₹${job.invoice.finalAmount}` : `₹${subtotal}`;

      let message = "";
      if (station.serviceCompletedTemplate) {
        message = station.serviceCompletedTemplate
          .replace(/{customerName}/g, job.customer.name)
          .replace(/{vehicleNumber}/g, job.vehicle.vehicleNumber.toUpperCase())
          .replace(/{invoiceUrl}/g, reportLink)
          .replace(/{reportUrl}/g, reportLink)
          .replace(/{amount}/g, amountVal)
          .replace(/{upiId}/g, station.upiId || "");
      } else {
        message = `Hi ${job.customer.name},\n\nYour vehicle ${job.vehicle.vehicleNumber.toUpperCase()} service is complete at ${station.name}.\n\n📁 View Service Report: ${reportLink}\n💵 Amount: ${amountVal}\n\nThank you for choosing us!`;
      }

      let phone = job.customer.mobile.replace(/\D/g, "");
      if (phone.length === 10) {
        phone = "91" + phone;
      }

      const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      setSuccess("Opened WhatsApp share window!");
    } catch (err: any) {
      setError(err.message || "Failed to share via WhatsApp.");
    } finally {
      setSharing(false);
    }
  }

  async function handleSharePaymentReminder() {
    if (!job.invoice) return;
    setError("");
    setSuccess("");

    try {
      const amountVal = `₹${job.invoice.finalAmount}`;
      let message = "";
      if (station.paymentReminderTemplate) {
        message = station.paymentReminderTemplate
          .replace(/{customerName}/g, job.customer.name)
          .replace(/{vehicleNumber}/g, job.vehicle.vehicleNumber.toUpperCase())
          .replace(/{amount}/g, amountVal)
          .replace(/{upiId}/g, station.upiId || "");
      } else {
        message = `Hi ${job.customer.name},\n\nFriendly reminder: payment of ${amountVal} is pending for your vehicle ${job.vehicle.vehicleNumber.toUpperCase()} service at ${station.name}.\n\nUPI ID: ${station.upiId || "N/A"}\n\nPlease complete checkout. Thank you!`;
      }

      let phone = job.customer.mobile.replace(/\D/g, "");
      if (phone.length === 10) {
        phone = "91" + phone;
      }

      const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      setSuccess("Opened WhatsApp payment reminder share window!");
    } catch (err: any) {
      setError(err.message || "Failed to share payment reminder.");
    }
  }

  // After Photos State
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [afterPhotos, setAfterPhotos] = useState<string[]>(
    initialJob.photos.filter((p) => p.type === "AFTER").map((p) => p.url)
  );

  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Customer Left");
  const [cancelNotes, setCancelNotes] = useState("");

  // Invoice Generation State
  const [discountAmount, setDiscountAmount] = useState(0);

  // Collect Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const beforePhotos = job.photos.filter((p) => p.type === "BEFORE").map((p) => p.url);

  async function handleStatusTransition(nextStatus: JobStatus) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/job-cards/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to update job status.");
        }

        setJob((prev) => ({ ...prev, status: nextStatus }));
        setSuccess(`Status updated to ${nextStatus.replace("_", " ").toLowerCase()}!`);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Could not transition status.");
      }
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

      // Save photos in DB linked to Job Card
      // We will create them locally via an API call or just save status
      // For this MVP, we save photos on status updates or append them.
      // Let's call an API to save job photos!
      const photoPromises = urls.map(async (url) => {
        return fetch(`/api/job-cards/${job.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, type: "AFTER" }),
        }).then((res) => res.json());
      });

      await Promise.all(photoPromises);

      setAfterPhotos((prev) => [...prev, ...urls]);
      setSuccess("After photo added successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload after photos.");
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowCancelModal(false);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/job-cards/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            cancellationReason: cancelReason,
            cancellationNotes: cancelNotes,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to cancel job card.");
        }

        setJob((prev) => ({
          ...prev,
          status: "CANCELLED",
          cancellationReason: cancelReason,
          cancellationNotes: cancelNotes,
        }));
        setSuccess("Job cancelled successfully.");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Could not cancel job.");
      }
    });
  }

  async function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobCardId: job.id,
            discount: Number(discountAmount),
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to generate invoice.");
        }

        setJob((prev) => ({
          ...prev,
          status: "PAYMENT_PENDING",
          invoice: {
            ...result.invoice,
            subtotal: Number(result.invoice.subtotal),
            discount: Number(result.invoice.discount),
            finalAmount: Number(result.invoice.finalAmount),
          },
        }));

        setSuccess("Invoice generated! Awaiting payment details.");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Could not generate invoice.");
      }
    });
  }

  async function handleConfirmPayment() {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/invoices/${job.invoice?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: selectedPaymentMethod,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to confirm payment.");
        }

        setJob((prev) => ({
          ...prev,
          status: "DELIVERED",
          invoice: prev.invoice
            ? {
                ...prev.invoice,
                paymentStatus: "PAID",
                paymentMethod: selectedPaymentMethod,
              }
            : null,
        }));

        setSuccess("Payment confirmed and vehicle delivered!");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Could not confirm payment.");
      }
    });
  }

  const getJobStatusLabel = (status: JobStatus) => {
    return status.replace("_", " ").toLowerCase();
  };

  const getStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case "RECEIVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SERVICE_COMPLETED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PAYMENT_PENDING":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Generate UPI QR String
  const upiUrl = job.invoice
    ? `upi://pay?pa=${station.upiId}&pn=${encodeURIComponent(station.name)}&am=${job.invoice.finalAmount}&cu=INR&tn=${job.invoice.invoiceNumber}`
    : "";

  const qrImageUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
    : "";

  const subtotal = job.services.reduce((sum, s) => sum + s.priceSnapshot, 0);

  return (
    <div className="space-y-6">
      {/* Header Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft size={16} />
          Back to operations queue
        </Link>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase border px-3 py-1 rounded-full ${getStatusBadgeClass(job.status)}`}>
            {getJobStatusLabel(job.status)}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="shrink-0" size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Status progression workflow panel */}
      {job.status !== "DELIVERED" && job.status !== "CANCELLED" && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Status Workflow</h3>

          <div className="flex flex-wrap items-center gap-3">
            {job.status === "RECEIVED" && (
              <button
                onClick={() => handleStatusTransition("IN_PROGRESS")}
                disabled={isPending}
                className="px-5 py-2.5 rounded-lg text-white font-bold text-sm bg-[var(--primary-color)] hover:brightness-95 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
              >
                {isPending && <Loader2 className="animate-spin" size={16} />}
                Start Service
              </button>
            )}

            {job.status === "IN_PROGRESS" && (
              <button
                onClick={() => handleStatusTransition("SERVICE_COMPLETED")}
                disabled={isPending}
                className="px-5 py-2.5 rounded-lg text-white font-bold text-sm bg-[var(--primary-color)] hover:brightness-95 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
              >
                {isPending && <Loader2 className="animate-spin" size={16} />}
                Complete Service
              </button>
            )}

            {job.status === "SERVICE_COMPLETED" && (
              <form onSubmit={handleGenerateInvoice} className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="discount">Apply Discount (INR)</label>
                  <input
                    id="discount"
                    type="number"
                    min={0}
                    max={subtotal}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-10 border rounded-lg px-3 text-sm font-bold w-36 outline-none focus:border-[var(--primary-color)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 rounded-lg text-white font-bold text-sm bg-[var(--primary-color)] hover:brightness-95 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
                >
                  {isPending && <Loader2 className="animate-spin" size={16} />}
                  Generate Invoice
                </button>
              </form>
            )}

            {job.status === "PAYMENT_PENDING" && job.invoice && (
              <div className="space-y-4 w-full">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Payment Method</h4>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  {[
                    [PaymentMethod.CASH, "Cash"],
                    [PaymentMethod.UPI, "UPI QR"],
                    [PaymentMethod.CARD, "Card"],
                    [PaymentMethod.BANK, "Bank Transfer"],
                  ].map(([method, label]) => (
                    <button
                      key={method as string}
                      onClick={() => setSelectedPaymentMethod(method as PaymentMethod)}
                      className={`h-11 border rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                        selectedPaymentMethod === method
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 text-[var(--primary-color)]"
                          : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {method === PaymentMethod.UPI ? <QrCode size={14} /> : <CreditCard size={14} />}
                      {label as string}
                    </button>
                  ))}
                </div>

                {selectedPaymentMethod === PaymentMethod.UPI && station.upiId && qrImageUrl && (
                  <div className="bg-slate-50 border rounded-xl p-5 flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <p className="text-xs font-bold text-slate-500">Scan QR Code to Pay</p>
                    <img src={qrImageUrl} alt="UPI QR Code" className="h-44 w-44 object-contain border rounded-lg bg-white p-2 shadow-sm" />
                    <p className="text-sm font-extrabold text-[var(--primary-color)]">₹{job.invoice.finalAmount}</p>
                    <p className="text-[10px] text-slate-400 font-medium">UPI: {station.upiId}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isPending || !selectedPaymentMethod}
                    className="px-6 py-2.5 rounded-lg text-white font-bold text-sm bg-[var(--primary-color)] hover:brightness-95 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
                  >
                    {isPending && <Loader2 className="animate-spin" size={16} />}
                    Confirm Payment & Deliver
                  </button>
                </div>
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 rounded-lg border text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
            >
              Cancel Job
            </button>
          </div>
        </div>
      )}

      {/* 2. Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px]">
        {/* Left Side: Services, Photos, Inspections */}
        <div className="space-y-6">
          {/* Services snapshot details */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Servicing Items</h3>
            <div className="divide-y space-y-2">
              {job.services.map((s) => (
                <div key={s.id} className="flex justify-between py-2 items-center text-sm">
                  <span className="font-bold text-slate-800">{s.serviceNameSnapshot}</span>
                  <span className="font-extrabold text-slate-800">₹{s.priceSnapshot}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 font-extrabold text-sm border-t text-[var(--primary-color)]">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
            </div>
          </div>

          {/* Inspection details */}
          {job.inspection && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <FileText size={16} />
                Inspection Notes
              </h3>
              <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 border rounded-xl">
                {job.inspection.notes}
              </p>
            </div>
          )}

          {/* BEFORE Photos */}
          {beforePhotos.length > 0 && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Before Servicing Photos</h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {beforePhotos.map((url, idx) => (
                  <div key={idx} className="h-24 border rounded-lg overflow-hidden bg-slate-50 relative">
                    <img src={url} alt="Before" className="object-cover h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AFTER Photos */}
          {(job.status === "IN_PROGRESS" ||
            job.status === "SERVICE_COMPLETED" ||
            job.status === "PAYMENT_PENDING" ||
            afterPhotos.length > 0) && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">After Servicing Photos</h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {afterPhotos.map((url, idx) => (
                  <div key={idx} className="h-24 border rounded-lg overflow-hidden bg-slate-50 relative">
                    <img src={url} alt="After" className="object-cover h-full w-full" />
                  </div>
                ))}

                {/* If active, allow upload after photos */}
                {job.status !== "DELIVERED" && job.status !== "CANCELLED" && (
                  <>
                    {uploadingPhotos ? (
                      <div className="h-24 border rounded-lg bg-slate-50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[var(--primary-color)]" size={24} />
                      </div>
                    ) : (
                      <label className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
                        <Camera size={24} />
                        <span className="text-[10px] font-bold mt-1.5">Add After Photo</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Vehicle, Customer, and Invoice detail */}
        <div className="space-y-6">
          {/* Job Details metadata */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Vehicle & Client</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-slate-400" />
                <div>
                  <span className="font-extrabold text-slate-800 tracking-wide uppercase">
                    {job.vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{job.vehicle.vehicleType} • {job.vehicle.brand} {job.vehicle.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t pt-2">
                <User size={16} className="text-slate-400" />
                <div>
                  <p className="font-bold text-slate-800">{job.customer.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                    <Phone size={10} /> {job.customer.mobile}
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            {(job.status === "SERVICE_COMPLETED" || job.status === "PAYMENT_PENDING" || job.status === "DELIVERED") && (
              <div className="pt-3 border-t">
                <button
                  onClick={handleWhatsAppShare}
                  disabled={sharing}
                  className="w-full flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {sharing ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.012 2c-5.506 0-9.991 4.475-9.991 9.972 0 1.758.459 3.473 1.332 4.974l-1.417 5.176 5.312-1.386c1.458.79 3.094 1.206 4.757 1.207h.007c5.505 0 9.99-4.474 9.99-9.973 0-2.665-1.041-5.168-2.932-7.054-1.89-1.889-4.394-2.916-7.058-2.916zm-5.023 14.521c-.482-.284-.963-.448-1.439-.176l-.312.181c-.475.275-.956.12-.956-.37l.423-1.53c.09-.327-.03-.687-.29-.908-.948-1.517-1.439-3.267-1.439-5.068 0-4.947 4.045-8.973 9.027-8.973 2.41 0 4.673.935 6.377 2.632 1.703 1.696 2.641 3.95 2.64 6.342-.002 4.948-4.047 8.974-9.027 8.974-1.513-.001-3.003-.377-4.321-1.096-.24-.131-.53-.131-.762-.008l-1.564.408 1.189-4.337zm8.441-2.943c-.27-.135-1.597-.785-1.846-.876-.25-.09-.431-.135-.612.135-.181.27-.701.876-.859 1.057-.159.18-.318.202-.589.067-.27-.135-1.14-.42-2.172-1.338-.802-.712-1.344-1.591-1.502-1.861-.158-.27-.017-.417.118-.551.121-.121.27-.315.405-.472.135-.158.18-.27.27-.45.09-.18.045-.337-.022-.472-.068-.135-.612-1.474-.839-2.015-.221-.529-.446-.457-.612-.465-.158-.008-.339-.009-.52-.009s-.475.068-.724.337c-.249.27-.951.923-.951 2.251s.973 2.61.109 2.746c-.864.135-1.748-.288-2.617-.674-.637-.284-1.229-.684-1.758-1.185-.75-.713-1.336-1.589-1.503-1.859-.158-.27.016-.415.15-.55.121-.12.27-.315.405-.47.135-.157.18-.27.27-.45.09-.18.045-.337-.023-.472z"/>
                      </svg>
                      Share Report via WhatsApp
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Invoice Summary Card */}
          {job.invoice && (
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Invoice summary</h3>
              <div className="space-y-2.5 text-sm font-semibold">
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Invoice No:</span>
                  <span className="text-slate-800 font-bold">{job.invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="text-slate-800">₹{job.invoice.subtotal}</span>
                </div>
                {job.invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount applied:</span>
                    <span>-₹{job.invoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-[var(--primary-color)] text-base font-extrabold">
                  <span>Final Amount:</span>
                  <span>₹{job.invoice.finalAmount}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-xs">
                  <span>Payment status:</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold uppercase ${
                    job.invoice.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {job.invoice.paymentStatus}
                  </span>
                </div>
                {job.invoice.paymentMethod && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Method:</span>
                    <span className="font-bold text-slate-800">{job.invoice.paymentMethod}</span>
                  </div>
                )}
                {job.invoice.paymentStatus === "PENDING" && (
                  <button
                    type="button"
                    onClick={handleSharePaymentReminder}
                    className="w-full mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition"
                  >
                    Send Payment Reminder
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <header className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">Cancel Job Card</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="cancelReason">Cancellation Reason *</label>
                <select
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-10 w-full border rounded-lg px-3 text-sm outline-none bg-white font-medium"
                >
                  <option value="Customer Left">Customer Left</option>
                  <option value="Wrong Entry">Wrong Entry</option>
                  <option value="Price Disagreement">Price Disagreement</option>
                  <option value="Service Unavailable">Service Unavailable</option>
                  <option value="Duplicate Entry">Duplicate Entry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="cancelNotes">Notes (Optional)</label>
                <textarea
                  id="cancelNotes"
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Provide details about why the job is cancelled..."
                  className="w-full h-16 border rounded-lg p-3 text-sm outline-none resize-none"
                />
              </div>

              <footer className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-slate-55 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg text-white text-xs font-bold px-4 hover:bg-rose-700 transition bg-rose-600"
                >
                  {isPending ? <Loader2 className="animate-spin" size={14} /> : "Cancel Job Card"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
