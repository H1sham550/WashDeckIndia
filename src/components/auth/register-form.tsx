"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Lock,
  CheckCircle,
  Sparkles,
  Car,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  ShieldCheck,
  Check,
} from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Credentials & Station Name
  const [credentials, setCredentials] = useState({
    ownerName: "",
    stationName: "",
    identity: "",
    password: "",
  });

  // Step 2: Selected Plan
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "PRO_STATION" | "ENTERPRISE">("PRO_STATION");

  // Step 3: Vehicle Wash Prices
  const [prices, setPrices] = useState({
    BIKE: 20,
    HATCHBACK: 35,
    SEDAN: 45,
    SUV: 65,
    LUXURY: 95,
  });

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.ownerName.trim() || !credentials.stationName.trim() || !credentials.identity.trim() || !credentials.password.trim()) {
      setError("Please fill in all required fields to proceed.");
      return;
    }
    if (credentials.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credentials,
          selectedPlan,
          prices,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create store account.");
      }

      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        {[
          { num: 1, title: "Account & Station" },
          { num: 2, title: "Plan & Free Trial" },
          { num: 3, title: "Wash Pricing" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                step === s.num
                  ? "bg-teal-700 text-white shadow-md ring-4 ring-teal-700/10"
                  : step > s.num
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span
              className={`text-xs font-bold hidden sm:inline ${
                step === s.num ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Account & Station Details */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-5">
          <div className="text-left space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Station & Account Setup</h3>
            <p className="text-xs text-slate-500 font-medium">Enter your store owner credentials and station details to start your account.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Owner Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdullah Al-Otaibi"
                  value={credentials.ownerName}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, ownerName: e.target.value }))}
                  className="h-11 w-full pl-10 pr-3.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Car Wash Store Name *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Auto Spa & Detailing"
                  value={credentials.stationName}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, stationName: e.target.value }))}
                  className="h-11 w-full pl-10 pr-3.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Mobile Number or Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210 or owner@washdeck.in"
                  value={credentials.identity}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, identity: e.target.value }))}
                  className="h-11 w-full pl-10 pr-3.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">Create Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="h-11 w-full pl-10 pr-3.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active-tap mt-6"
          >
            <span>Continue to Choose Plan</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* STEP 2: Choose Subscription Plan with 1-Month Free Trial */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center space-y-1.5">
            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              1 Month Free Trial Included
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Select Your Station Plan</h3>
            <p className="text-xs text-slate-500 font-medium">No credit card required to start. Enjoy 30 days of full feature access.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Starter Plan */}
            <div
              onClick={() => setSelectedPlan("STARTER")}
              className={`p-5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                selectedPlan === "STARTER"
                  ? "border-teal-700 bg-teal-50/50 ring-2 ring-teal-700/20 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Starter</span>
                  <Zap size={16} className="text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900">₹ 0</span>
                  <span className="text-[11px] text-slate-400 block font-semibold mt-0.5">1st Month Free (then 199/mo)</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5">✓ Up to 200 Jobs/Mo</li>
                  <li className="flex items-center gap-1.5">✓ 2 Staff Logins</li>
                  <li className="flex items-center gap-1.5">✓ Basic POS Queue</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60 text-center">
                <span className={`text-xs font-extrabold ${selectedPlan === "STARTER" ? "text-teal-700" : "text-slate-400"}`}>
                  {selectedPlan === "STARTER" ? "✓ Selected Plan" : "Select Starter"}
                </span>
              </div>
            </div>

            {/* Pro Plan (Recommended) */}
            <div
              onClick={() => setSelectedPlan("PRO_STATION")}
              className={`p-5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                selectedPlan === "PRO_STATION"
                  ? "border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/30 shadow-xl"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="absolute -top-3 right-3 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                Most Popular
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-teal-900">Pro Auto Spa</span>
                  <Crown size={16} className="text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900">₹ 0</span>
                  <span className="text-[11px] text-teal-700 block font-extrabold mt-0.5">1st Month Free (then 499/mo)</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-1.5">✓ Unlimited Jobs</li>
                  <li className="flex items-center gap-1.5">✓ Expense Tracker</li>
                  <li className="flex items-center gap-1.5">✓ WhatsApp Reports</li>
                  <li className="flex items-center gap-1.5">✓ 10 Staff Accounts</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-teal-200 text-center">
                <span className={`text-xs font-black ${selectedPlan === "PRO_STATION" ? "text-teal-800" : "text-slate-400"}`}>
                  {selectedPlan === "PRO_STATION" ? "✓ Selected Plan" : "Select Pro"}
                </span>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div
              onClick={() => setSelectedPlan("ENTERPRISE")}
              className={`p-5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                selectedPlan === "ENTERPRISE"
                  ? "border-teal-700 bg-teal-50/50 ring-2 ring-teal-700/20 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Enterprise</span>
                  <ShieldCheck size={16} className="text-indigo-600" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900">₹ 0</span>
                  <span className="text-[11px] text-slate-400 block font-semibold mt-0.5">1st Month Free (then 999/mo)</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5">✓ Multi-Branch</li>
                  <li className="flex items-center gap-1.5">✓ Loyalty Stamps</li>
                  <li className="flex items-center gap-1.5">✓ Custom Branding</li>
                </ul>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60 text-center">
                <span className={`text-xs font-extrabold ${selectedPlan === "ENTERPRISE" ? "text-teal-700" : "text-slate-400"}`}>
                  {selectedPlan === "ENTERPRISE" ? "✓ Selected Plan" : "Select Enterprise"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active-tap"
            >
              <span>Continue to Set Wash Prices</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Initial Vehicle Wash Prices Configuration */}
      {step === 3 && (
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          <div className="text-left space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Set Initial Wash Prices (₹ INR)</h3>
            <p className="text-xs text-slate-500 font-medium">Specify your station's wash pricing for different vehicle categories below. You can change these anytime in Settings.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Bike */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">🏍️ BIKE / Motorcycle</span>
                <span className="text-[10px] text-slate-400">Standard two-wheeler wash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={prices.BIKE}
                  onChange={(e) => setPrices((p) => ({ ...p, BIKE: Number(e.target.value) }))}
                  className="w-20 h-10 border border-slate-300 rounded-lg px-2 text-xs font-extrabold text-slate-900 text-right bg-white outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Hatchback */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">🚗 HATCHBACK / Small</span>
                <span className="text-[10px] text-slate-400">Compact city cars</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={prices.HATCHBACK}
                  onChange={(e) => setPrices((p) => ({ ...p, HATCHBACK: Number(e.target.value) }))}
                  className="w-20 h-10 border border-slate-300 rounded-lg px-2 text-xs font-extrabold text-slate-900 text-right bg-white outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Sedan */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">🚘 SEDAN / Medium</span>
                <span className="text-[10px] text-slate-400">Standard 4-door cars</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={prices.SEDAN}
                  onChange={(e) => setPrices((p) => ({ ...p, SEDAN: Number(e.target.value) }))}
                  className="w-20 h-10 border border-slate-300 rounded-lg px-2 text-xs font-extrabold text-slate-900 text-right bg-white outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* SUV */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">🚙 SUV / Crossover / 4x4</span>
                <span className="text-[10px] text-slate-400">Large SUVs and trucks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={prices.SUV}
                  onChange={(e) => setPrices((p) => ({ ...p, SUV: Number(e.target.value) }))}
                  className="w-20 h-10 border border-slate-300 rounded-lg px-2 text-xs font-extrabold text-slate-900 text-right bg-white outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Luxury */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex items-center justify-between sm:col-span-2">
              <div>
                <span className="font-extrabold text-xs text-slate-800 block">🏎️ LUXURY / Supercar</span>
                <span className="text-[10px] text-slate-400">Exotic, sports, and ultra-luxury vehicles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={prices.LUXURY}
                  onChange={(e) => setPrices((p) => ({ ...p, LUXURY: Number(e.target.value) }))}
                  className="w-20 h-10 border border-slate-300 rounded-lg px-2 text-xs font-extrabold text-slate-900 text-right bg-white outline-none focus:border-teal-700"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-12 px-5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition active-tap"
            >
              {loading ? (
                <span>Creating Account & Starting Trial...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Launch My Car Wash Store (1 Month FREE)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
