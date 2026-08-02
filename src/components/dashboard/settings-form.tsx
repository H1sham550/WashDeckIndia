"use client";

import React, { useState, useTransition } from "react";
import { 
  Upload, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Palette, 
  Sliders, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Hash,
  Clock,
  Calendar,
  AlertTriangle,
  Gift,
  Globe,
  LogOut
} from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";

type SettingsFormProps = {
  station: {
    name: string;
    logoUrl: string;
    bannerUrl: string;
    primaryColor: string;
    phone: string;
    email: string;
    address: string;
    upiId: string;
    gstNumber: string;
    vipSpendThreshold: number;
    vipVisitThreshold: number;
    defaultEta: number;
    reportExpiryDays: number;
    lostCustomerThresholdDays: number;
    dueForVisitThreshold: number;
    serviceCompletedTemplate: string;
    paymentReminderTemplate: string;
    dueForVisitReminderTemplate: string;
    rewardEligibleTemplate: string;
    locale?: string;
    currency?: string;
  };
};

export function SettingsForm({ station }: SettingsFormProps) {
  const [formData, setFormData] = useState(station);
  const [activeTab, setActiveTab] = useState<"branding" | "operations" | "communication" | "localization">("branding");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "bannerUrl") {
    const file = event.target.files?.[0];
    if (!file) return;

    if (field === "logoUrl") setUploadingLogo(true);
    else setUploadingBanner(true);

    setError("");
    setSuccess("");

    const data = new FormData();
    data.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to upload file.");
      }

      setFormData((prev) => ({ ...prev, [field]: result.url }));
      setSuccess("Image uploaded successfully! Remember to save changes.");
    } catch (err: any) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploadingLogo(false);
      setUploadingBanner(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/station/branding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to save settings.");
        }

        setSuccess("Settings saved successfully!");
        // Refresh page to apply brand color and logo changes immediately in the header
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err: any) {
        setError(err.message || "An error occurred while saving.");
      }
    });
  }

  const primaryStyle = { 
    "--primary-color-hover": formData.primaryColor + "15",
    "--primary-color-border": formData.primaryColor + "30",
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" style={primaryStyle}>
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="shrink-0" size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "branding"
              ? "bg-white shadow-sm text-slate-800 border-b-2"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
          style={activeTab === "branding" ? { borderBottomColor: formData.primaryColor } : {}}
        >
          <Palette size={16} style={{ color: activeTab === "branding" ? formData.primaryColor : undefined }} />
          Branding & Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("operations")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "operations"
              ? "bg-white shadow-sm text-slate-800 border-b-2"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
          style={activeTab === "operations" ? { borderBottomColor: formData.primaryColor } : {}}
        >
          <Sliders size={16} style={{ color: activeTab === "operations" ? formData.primaryColor : undefined }} />
          Operations Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("communication")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "communication"
              ? "bg-white shadow-sm text-slate-800 border-b-2"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
          style={activeTab === "communication" ? { borderBottomColor: formData.primaryColor } : {}}
        >
          <MessageSquare size={16} style={{ color: activeTab === "communication" ? formData.primaryColor : undefined }} />
          WhatsApp Templates
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("localization")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "localization"
              ? "bg-white shadow-sm text-slate-800 border-b-2"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
          style={activeTab === "localization" ? { borderBottomColor: formData.primaryColor } : {}}
        >
          <Globe size={16} style={{ color: activeTab === "localization" ? formData.primaryColor : undefined }} />
          Localization & i18n
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* BRANDING TAB */}
        {activeTab === "branding" && (
          <div className="space-y-6">
            {/* Visual Identity Section */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                <Sparkles size={18} style={{ color: formData.primaryColor }} />
                Visual Identity
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Business Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="object-contain h-full w-full" />
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">No logo</span>
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="animate-spin" size={18} style={{ color: formData.primaryColor }} />
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-md text-xs font-semibold hover:bg-slate-50 transition">
                      <Upload size={14} />
                      Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logoUrl")} />
                    </label>
                  </div>
                </div>

                {/* Theme Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="primaryColor">Theme Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-10 w-12 cursor-pointer border rounded-md p-1 bg-white"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#0f766e"
                      className="h-10 border rounded-md px-3 text-sm font-medium w-32 outline-none focus:border-[var(--primary-color)]"
                      style={{ focusBorderColor: formData.primaryColor } as React.CSSProperties}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Controls accents, header branding, and button colors.</p>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-semibold text-slate-700">Dashboard Banner Image</label>
                <div className="h-28 border rounded-lg overflow-hidden bg-slate-50 relative flex items-center justify-center">
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} alt="Banner" className="object-cover h-full w-full" />
                  ) : (
                    <p className="text-xs text-slate-400">No banner uploaded. A clean gray background will be displayed.</p>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[var(--primary-color)]" size={24} style={{ color: formData.primaryColor }} />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md text-xs font-semibold hover:bg-slate-50 transition mt-2">
                  <Upload size={14} />
                  Upload Banner Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "bannerUrl")} />
                </label>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                <Phone size={18} style={{ color: formData.primaryColor }} />
                Station Details & Contacts
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="stationName">Station Name</label>
                  <input
                    id="stationName"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Sparkle Shine Car Wash"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 99999 99999"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="email">Public Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@sparklespa.com"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Road, Block B, City"
                    className="h-11 w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Billing Details */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                <CreditCard size={18} style={{ color: formData.primaryColor }} />
                Payment & Billing
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="upiId">Station UPI ID (for QR codes)</label>
                  <input
                    id="upiId"
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="sparkle@upi"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used to generate dynamic payment QR codes with exact billing amount.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="gstNumber">GST Number</label>
                  <input
                    id="gstNumber"
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="29AAAAA1111A1Z1"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)] uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPERATIONS TAB */}
        {activeTab === "operations" && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                <Clock size={18} style={{ color: formData.primaryColor }} />
                Service & Time Optimization
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="defaultEta">Default Service ETA (Minutes)</label>
                  <div className="flex items-center border rounded-md overflow-hidden bg-white focus-within:border-[var(--primary-color)] dir-ltr">
                    <input
                      id="defaultEta"
                      type="number"
                      min={1}
                      required
                      value={formData.defaultEta}
                      onChange={(e) => setFormData((prev) => ({ ...prev, defaultEta: Number(e.target.value) || 120 }))}
                      className="h-11 flex-1 px-3 text-sm outline-none border-none bg-transparent"
                    />
                    <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 font-bold border-s shrink-0">mins</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Standard target duration assigned to new jobs on the intake wizard.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="reportExpiryDays">Report Link Validity (Days)</label>
                  <div className="flex items-center border rounded-md overflow-hidden bg-white focus-within:border-[var(--primary-color)] dir-ltr">
                    <input
                      id="reportExpiryDays"
                      type="number"
                      min={1}
                      required
                      value={formData.reportExpiryDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reportExpiryDays: Number(e.target.value) || 30 }))}
                      className="h-11 flex-1 px-3 text-sm outline-none border-none bg-transparent"
                    />
                    <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 font-bold border-s shrink-0">days</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Number of days online vehicle health check reports stay accessible for customers.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                <Calendar size={18} style={{ color: formData.primaryColor }} />
                Retention & Re-engagement Thresholds
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="dueForVisitThreshold">Due For Next Visit Threshold (Days)</label>
                  <div className="flex items-center border rounded-md overflow-hidden bg-white focus-within:border-[var(--primary-color)] dir-ltr">
                    <input
                      id="dueForVisitThreshold"
                      type="number"
                      min={1}
                      required
                      value={formData.dueForVisitThreshold}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueForVisitThreshold: Number(e.target.value) || 30 }))}
                      className="h-11 flex-1 px-3 text-sm outline-none border-none bg-transparent"
                    />
                    <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 font-bold border-s shrink-0">days</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Days since last visit after which a vehicle is marked as "Due for Visit" on dashboard.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="lostCustomerThresholdDays">Lost Customer Threshold (Days)</label>
                  <div className="flex items-center border rounded-md overflow-hidden bg-white focus-within:border-[var(--primary-color)] dir-ltr">
                    <input
                      id="lostCustomerThresholdDays"
                      type="number"
                      min={1}
                      required
                      value={formData.lostCustomerThresholdDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lostCustomerThresholdDays: Number(e.target.value) || 60 }))}
                      className="h-11 flex-1 px-3 text-sm outline-none border-none bg-transparent"
                    />
                    <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 font-bold border-s shrink-0">days</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Days of inactivity after which a customer is flagged as "Churned/Lost" in retention marketing.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                <Sparkles size={18} style={{ color: formData.primaryColor }} />
                VIP Tier Settings
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="vipSpendThreshold">VIP Spend Threshold (₹)</label>
                  <input
                    id="vipSpendThreshold"
                    type="number"
                    min={0}
                    required
                    value={formData.vipSpendThreshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vipSpendThreshold: Number(e.target.value) || 0 }))}
                    placeholder="10000"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Total customer spending (paid invoices) required to qualify for VIP status.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="vipVisitThreshold">VIP Visit Threshold</label>
                  <input
                    id="vipVisitThreshold"
                    type="number"
                    min={0}
                    required
                    value={formData.vipVisitThreshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vipVisitThreshold: Number(e.target.value) || 0 }))}
                    placeholder="5"
                    className="h-11 w-full border rounded-md px-3 text-sm outline-none focus:border-[var(--primary-color)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Total number of delivered washes required to qualify for VIP status.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMUNICATION TAB */}
        {activeTab === "communication" && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare size={18} style={{ color: formData.primaryColor }} />
                  WhatsApp Custom Templates
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Customize the SMS/WhatsApp message formats dispatched to clients. You can use variables inside curly braces.
                </p>
              </div>

              {/* Template Helper Card */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  Available Placeholders
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <div><strong className="text-amber-900 font-semibold">{"{customerName}"}</strong> - Customer's name</div>
                  <div><strong className="text-amber-900 font-semibold">{"{vehicleNumber}"}</strong> - Vehicle license plate</div>
                  <div><strong className="text-amber-900 font-semibold">{"{reportUrl}"}</strong> - Health report PDF link</div>
                  <div><strong className="text-amber-900 font-semibold">{"{amount}"}</strong> - Invoice bill amount</div>
                  <div><strong className="text-amber-900 font-semibold">{"{upiId}"}</strong> - UPI payment ID</div>
                  <div><strong className="text-amber-900 font-semibold">{"{stationName}"}</strong> - Your wash station name</div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Service Completed Template */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="serviceCompletedTemplate">Service Completed Template</label>
                  <textarea
                    id="serviceCompletedTemplate"
                    rows={3}
                    value={formData.serviceCompletedTemplate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serviceCompletedTemplate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] font-mono text-xs bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400">Triggered when job status transitions to "SERVICE COMPLETED" or shared manually from the job overview.</p>
                </div>

                {/* Payment Pending Reminder */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="paymentReminderTemplate">Payment Pending Reminder Template</label>
                  <textarea
                    id="paymentReminderTemplate"
                    rows={3}
                    value={formData.paymentReminderTemplate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentReminderTemplate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] font-mono text-xs bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400">Sent to request payment checkouts for outstanding invoice amounts.</p>
                </div>

                {/* Due for next visit Template */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="dueForVisitReminderTemplate">Due for Next Visit Reminder Template</label>
                  <textarea
                    id="dueForVisitReminderTemplate"
                    rows={3}
                    value={formData.dueForVisitReminderTemplate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueForVisitReminderTemplate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] font-mono text-xs bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400">Dispatched automatically or manually to nudge customers who have not visited within the retention window.</p>
                </div>

                {/* Loyalty Reward Unlocked Template */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="rewardEligibleTemplate">Loyalty Reward Earned Template</label>
                  <textarea
                    id="rewardEligibleTemplate"
                    rows={3}
                    value={formData.rewardEligibleTemplate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rewardEligibleTemplate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary-color)] font-mono text-xs bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400">Sent when a vehicle completes stamps requirements and unlocks a loyalty reward discount.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCALIZATION & i18n TAB */}
        {activeTab === "localization" && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
                <Globe size={20} style={{ color: formData.primaryColor }} />
                Regional Localization & Language Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure station language and number formatting. Selecting Arabic will automatically mirror all operator interfaces (sidebar, tables, queue boards, and invoices) to Right-To-Left (RTL) layout.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Default Station Language
                  </label>
                  <select
                    value={formData.locale || "en-SA"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, locale: e.target.value }))}
                    className="w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50/70 outline-none focus:border-[var(--primary-color)] transition"
                  >
                    <option value="en-SA">English (en-SA) — LTR</option>
                    <option value="ar-SA">العربية (ar-SA) — RTL (Auto-mirroring)</option>
                    <option value="en-AE">English (en-AE) — LTR</option>
                    <option value="ar-AE">العربية (ar-AE) — RTL (Auto-mirroring)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Determines UI language dictionaries, booking intake forms, and automated PDF invoice headers.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Base Currency Code
                  </label>
                  <select
                    value={formData.currency || "SAR"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                    className="w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50/70 outline-none focus:border-[var(--primary-color)] transition"
                  >
                    <option value="SAR">Saudi Riyal (SAR / ر.س)</option>
                    <option value="AED">UAE Dirham (AED / د.إ)</option>
                    <option value="BHD">Bahraini Dinar (BHD)</option>
                    <option value="INR">Indian Rupee (INR / ₹)</option>
                    <option value="USD">US Dollar (USD / $)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Formatted dynamically via native Intl currency standards across POS checkouts and financial reports.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3 mt-4">
                <Globe size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Enterprise i18n Architecture Status: LTR / RTL Active</p>
                  <p className="text-blue-700">
                    Static translation dictionaries (`/src/locales/en` and `/src/locales/ar`) ensure zero-latency renders with no runtime AI translation dependencies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-white font-bold transition shadow-sm hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: formData.primaryColor }}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Saving settings...
          </>
        ) : (
          "Save station settings"
        )}
      </button>

      {/* Account & Session Sign Out Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <LogOut size={16} className="text-slate-500" />
            Account & Session Security
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Sign out of your store owner account session on this device.
          </p>
        </div>
        <LogoutButton />
      </div>
    </form>
  );
}
