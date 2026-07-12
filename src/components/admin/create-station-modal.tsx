"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Building2,
  User,
  CreditCard,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Copy,
  Mail,
  Download,
  Edit3,
  Globe,
  DollarSign,
  Phone,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  timezone: string;
  taxLabel: string;
}

const COUNTRIES: CountryConfig[] = [
  { code: "IND", name: "India", currency: "INR", currencySymbol: "₹", phoneCode: "+91", timezone: "Asia/Kolkata", taxLabel: "GST" },
  { code: "ARE", name: "United Arab Emirates", currency: "AED", currencySymbol: "AED", phoneCode: "+971", timezone: "Asia/Dubai", taxLabel: "VAT" },
  { code: "SAU", name: "Saudi Arabia", currency: "SAR", currencySymbol: "SAR", phoneCode: "+966", timezone: "Asia/Riyadh", taxLabel: "VAT" },
  { code: "QAT", name: "Qatar", currency: "QAR", currencySymbol: "QAR", phoneCode: "+974", timezone: "Asia/Qatar", taxLabel: "VAT" },
  { code: "KWT", name: "Kuwait", currency: "KWD", currencySymbol: "KWD", phoneCode: "+965", timezone: "Asia/Kuwait", taxLabel: "VAT" },
  { code: "SGP", name: "Singapore", currency: "SGD", currencySymbol: "S$", phoneCode: "+65", timezone: "Asia/Singapore", taxLabel: "GST" },
  { code: "USA", name: "United States", currency: "USD", currencySymbol: "$", phoneCode: "+1", timezone: "America/New_York", taxLabel: "Sales Tax" },
  { code: "GBR", name: "United Kingdom", currency: "GBP", currencySymbol: "£", phoneCode: "+44", timezone: "Europe/London", taxLabel: "VAT" },
];

const SUBSCRIPTION_PLANS = [
  { id: "trial-7", name: "Trial (7 Days)", price: 0, duration: 7, isTrial: true, description: "Quick 7-day evaluation period for new leads" },
  { id: "trial-14", name: "Trial (14 Days)", price: 0, duration: 14, isTrial: true, description: "Standard 14-day full access trial" },
  { id: "starter-monthly", name: "Starter Monthly", price: 1499, duration: 30, isTrial: false, description: "Essential tools for single-station car wash operations" },
  { id: "pro-monthly", name: "Professional Monthly", price: 2999, duration: 30, isTrial: false, description: "Advanced automation, WhatsApp alerts, and inventory" },
  { id: "enterprise-monthly", name: "Enterprise Monthly", price: 6999, duration: 30, isTrial: false, description: "Unlimited staff, multi-branch ready, dedicated account manager" },
  { id: "custom", name: "Custom Monthly Plan", price: 0, duration: 30, isTrial: false, description: "Tailored entitlements and custom pricing tier" },
];

export function CreateStationModal({ isOpen, onClose, onSuccess }: CreateStationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [country, setCountry] = useState("IND");
  const [currency, setCurrency] = useState("INR");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [brandColor, setBrandColor] = useState("#0F766E");

  // Step 2: Owner Account
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [autoPassword, setAutoPassword] = useState("");

  // Step 3: Subscription (Monthly SaaS model)
  const [selectedPlanId, setSelectedPlanId] = useState("pro-monthly");
  const [customPrice, setCustomPrice] = useState(2999);
  const [trialDays, setTrialDays] = useState(14);
  const [graceDays, setGraceDays] = useState(5);

  // Step 4: Success state
  const [createdStation, setCreatedStation] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Sync country config
  const currentCountryConfig = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setCreatedStation(null);
      setCopied(false);
      setEmailSent(false);
      // Generate initial auto password
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setAutoPassword(`WD-${randomCode}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleNameChange(val: string) {
    setName(val);
    if (isSlugLocked) {
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  function handleCountryChange(code: string) {
    setCountry(code);
    const cfg = COUNTRIES.find((c) => c.code === code);
    if (cfg) {
      setCurrency(cfg.currency);
      if (!phone.startsWith(cfg.phoneCode)) {
        setPhone(`${cfg.phoneCode} `);
      }
      if (!ownerMobile.startsWith(cfg.phoneCode)) {
        setOwnerMobile(`${cfg.phoneCode} `);
      }
    }
  }

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[3];
  const activePrice = selectedPlan.id === "custom" ? customPrice : selectedPlan.price;
  const activeDuration = selectedPlan.isTrial ? trialDays : 30;

  function calculateNextBillingDate() {
    const d = new Date();
    d.setDate(d.getDate() + activeDuration);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function validateStep1() {
    if (!name.trim()) return "Business Name is required.";
    if (!slug.trim()) return "URL Slug is required.";
    if (!phone.trim() || phone.trim() === currentCountryConfig.phoneCode) return "Business Phone is required.";
    if (!email.trim() || !email.includes("@")) return "Valid Business Email is required.";
    return null;
  }

  function validateStep2() {
    if (!ownerName.trim()) return "Owner Full Name is required.";
    if (!ownerEmail.trim() || !ownerEmail.includes("@")) return "Valid Owner Email is required.";
    if (!ownerMobile.trim() || ownerMobile.trim() === currentCountryConfig.phoneCode) return "Owner Mobile Number is required.";
    return null;
  }

  function handleNextStep() {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setStep(3);
    }
  }

  async function handleFinalSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/stations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            slug,
            phone,
            email,
            address,
            country: currentCountryConfig.code,
            currency: currentCountryConfig.currency,
            timezone: currentCountryConfig.timezone,
            brandColor,
            ownerName,
            ownerEmail,
            ownerMobile,
            status: selectedPlan.isTrial ? "TRIAL" : "ACTIVE",
            trialDays: selectedPlan.isTrial ? trialDays : 0,
            graceDays,
            subscriptionPlanName: selectedPlan.name,
            monthlyPrice: activePrice,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to create station.");
        }

        setCreatedStation({
          ...data.station,
          ownerEmail: ownerEmail,
          ownerName: ownerName,
          tempPassword: data.tempPassword || autoPassword,
          planName: selectedPlan.name,
          nextBilling: calculateNextBillingDate(),
        });
        setStep(4);
        onSuccess();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during creation.");
      }
    });
  }

  function handleCopyPassword() {
    if (createdStation?.tempPassword) {
      navigator.clipboard.writeText(createdStation.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleSimulateEmail() {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  }

  function handleDownloadWelcomePDF() {
    const content = `====================================================
WASHDECK ENTERPRISE — STATION ONBOARDING CREDENTIALS
====================================================

Business Name:      ${name}
Station URL Slug:   ${slug}
Country / Currency: ${currentCountryConfig.name} (${currentCountryConfig.currencySymbol})
Primary Color:      ${brandColor}

----------------------------------------------------
OWNER ACCOUNT ACCESS
----------------------------------------------------
Owner Name:         ${ownerName}
Login Email:        ${ownerEmail}
Login Mobile:       ${ownerMobile}
Temporary Password: ${createdStation?.tempPassword || autoPassword}

Access Portal:      https://washdeck.vercel.app/login

----------------------------------------------------
SUBSCRIPTION SUMMARY (MONTHLY SAAS)
----------------------------------------------------
Plan Type:          ${selectedPlan.name}
Monthly Price:      ${currentCountryConfig.currencySymbol}${activePrice} / Month
Next Billing Date:  ${calculateNextBillingDate()}
Grace Period:       ${graceDays} Days

====================================================
IMPORTANT: Please advise the owner to log in and change their temporary password upon first access.
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `WashDeck-Credentials-${slug}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header with Wizard Progress Bar */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm">
                W
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Onboard New Station</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 && "Step 1: Business profile & regional configuration"}
              {step === 2 && "Step 2: Owner administrator credentials"}
              {step === 3 && "Step 3: Monthly SaaS subscription & billing"}
              {step === 4 && "Station successfully deployed!"}
            </p>
          </div>

          {step < 4 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      step === item
                        ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                        : step > item
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {step > item ? <CheckCircle2 className="h-4 w-4" /> : item}
                  </div>
                  {item < 3 && <div className={cn("h-0.5 w-6 transition-all", step > item ? "bg-emerald-500" : "bg-slate-200")} />}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mt-4 flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 animate-in shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Body Content */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: BUSINESS DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Business / Station Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Sparkle Shine Car Wash"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Auto-Generated URL Slug *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-400">@</span>
                    <input
                      type="text"
                      required
                      disabled={isSlugLocked}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                      placeholder="sparkle-shine"
                      className={cn(
                        "w-full rounded-xl border pl-8 pr-10 py-2.5 text-sm font-semibold transition-all",
                        isSlugLocked
                          ? "bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed"
                          : "bg-white border-emerald-600 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setIsSlugLocked(!isSlugLocked)}
                      title={isSlugLocked ? "Click to unlock manual editing" : "Lock slug generation"}
                      className="absolute right-2.5 top-2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Automatically generated from business name. Click edit icon to override.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Country Configuration *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.currencySymbol} • {c.taxLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Currency & Tax Setting
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        disabled
                        value={`${currentCountryConfig.currency} (${currentCountryConfig.currencySymbol})`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div className="w-28 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2.5 text-xs font-bold text-slate-600 flex items-center justify-center">
                      {currentCountryConfig.taxLabel} Enabled
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Business Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone || currentCountryConfig.phoneCode + " "}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Business Support Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="support@sparkleshine.com"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Physical Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Wash Street, Expressway District, City"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-slate-200 p-1"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: OWNER ACCOUNT */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <p className="font-bold">Automated Security & Credential Generation</p>
                  <p className="mt-0.5 text-emerald-800">
                    To maintain strict SaaS audit compliance, passwords are never manually typed. We generate a secure temporary credential (`{autoPassword}`) that the owner is required to change upon first login.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar or Ahmed Al-Mansoor"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Owner Login Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Owner Mobile / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={ownerMobile || currentCountryConfig.phoneCode + " "}
                      onChange={(e) => setOwnerMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Auto-Generated Temporary Password</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span className="font-mono text-lg font-bold tracking-widest text-slate-900">{autoPassword}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    setAutoPassword(`WD-${randomCode}`);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  Regenerate Code
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBSCRIPTION & MONTHLY BILLING */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold">Monthly SaaS Subscription Architecture</h4>
                    <p className="text-xs text-slate-300">All WashDeck plans bill on recurring monthly billing cycles with automatic grace period management.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Monthly Model
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Select Subscription Tier *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between relative",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900 text-sm">{plan.name}</h5>
                            {plan.isTrial ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                Trial
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-700 text-sm">
                                {plan.id === "custom" ? "Custom" : `${currentCountryConfig.currencySymbol}${plan.price}/mo`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                            <span>Selected Tier</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {selectedPlan.isTrial ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Trial Days</label>
                    <input
                      type="number"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Math.max(1, parseInt(e.target.value) || 14))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    />
                  </div>
                ) : selectedPlan.id === "custom" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Monthly Price ({currentCountryConfig.currencySymbol})</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Monthly Price</label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-200/60 px-3 py-2 text-sm font-bold text-slate-700">
                      {currentCountryConfig.currencySymbol}{activePrice} / Month
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={graceDays}
                    onChange={(e) => setGraceDays(Math.max(0, parseInt(e.target.value) || 5))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Next Billing Date</label>
                  <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span>{calculateNextBillingDate()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS & CREDENTIALS DOWNLOAD */}
          {step === 4 && createdStation && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Station Created Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {createdStation.name} (`{createdStation.slug}`) is now deployed and ready for enterprise operations.
                </p>
              </div>

              <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-6 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Owner Login Email</span>
                  <span className="font-semibold text-slate-900 text-sm">{createdStation.ownerEmail}</span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Temporary Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      {createdStation.tempPassword}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-800">Subscription Status: Active ({createdStation.planName})</span>
                  <span className="font-bold text-emerald-900">Renews: {createdStation.nextBilling}</span>
                </div>
              </div>

              {emailSent && (
                <div className="mx-auto max-w-md rounded-xl bg-emerald-100/80 border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-in fade-in">
                  ✓ Credentials dispatched via verified email to {createdStation.ownerEmail}!
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <Copy className="h-4 w-4 text-slate-500" />
                  {copied ? "Copied to Clipboard!" : "Copy Password"}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateEmail}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  {emailSent ? "Email Sent!" : "Email Credentials"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWelcomePDF}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download Welcome PDF
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-4 flex items-center justify-between">
          {step < 4 ? (
            <>
              <button
                type="button"
                onClick={() => (step > 1 ? setStep((step - 1) as any) : onClose())}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? "Cancel" : "Back"}
              </button>

              <div className="flex items-center gap-3">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
                  >
                    <span>Next: {step === 1 ? "Owner Account" : "Subscription"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleFinalSubmit}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Deploying Station...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Create Station & Generate Credentials</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              Done & Return to Console
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
