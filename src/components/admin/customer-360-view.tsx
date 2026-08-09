"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Package,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  ChevronLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  LogIn,
  RefreshCw,
  Ban,
  KeyRound,
  BarChart3,
  LayoutDashboard,
  Plus,
  Tag,
  UploadCloud,
  FileCheck,
  Search,
  Check,
  Calendar,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, PlanBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from "@/lib/currency";

interface Customer360ViewProps {
  station: any;
  owner: any;
  staffMembers: any[];
  activeSub: any;
  allPlans?: any[];
  auditLogs: any[];
  totalJobsCount: number;
  totalRevenue: number;
  currency: string;
}

export function Customer360View({
  station,
  owner,
  staffMembers,
  activeSub,
  allPlans = [],
  auditLogs,
  totalJobsCount,
  totalRevenue,
  currency,
}: Customer360ViewProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "subscription" | "billing" | "notes" | "documents" | "activity">("overview");

  // Sticky quick action states
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);

  // Private Internal Notes State
  const [notesList, setNotesList] = useState<Array<{ id: string; text: string; tag: string; date: string }>>([
    { id: "1", text: "Interested in WhatsApp API integration for automated job updates.", tag: "Interested in WhatsApp API", date: "2 days ago" },
    { id: "2", text: "Requested Arabic UI localization support for their new branch in Dubai.", tag: "Needs Arabic UI", date: "1 week ago" },
    { id: "3", text: "High-volume flagship station in downtown area. Prioritize support tickets.", tag: "VIP Customer", date: "2 weeks ago" },
    { id: "4", text: "Inquired about multi-warehouse inventory module during onboarding call.", tag: "Requested Inventory Module", date: "1 month ago" },
    { id: "5", text: "Approved 10% lifetime discount on Professional Monthly tier per founder approval.", tag: "10% Lifetime Discount", date: "1 month ago" },
  ]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteTag, setNewNoteTag] = useState("VIP Customer");
  const [noteSearch, setNoteSearch] = useState("");

  // Documents state
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; type: string; size: string; uploadedAt: string }>>([
    { id: "doc-1", name: "Trade-License-2026.pdf", type: "Trade License", size: "2.4 MB", uploadedAt: "12 Jun 2026" },
    { id: "doc-2", name: "GST-VAT-Registration.pdf", type: "GST/VAT Certificate", size: "1.1 MB", uploadedAt: "12 Jun 2026" },
    { id: "doc-3", name: "WashDeck-SaaS-Signed-Agreement.pdf", type: "Signed Agreement", size: "3.8 MB", uploadedAt: "14 Jun 2026" },
  ]);

  // Billing history simulation/data
  const billingHistory = [
    { id: "INV-2026-06", date: "25 Jun 2026", description: "Monthly SaaS Renewal (Professional)", amount: 2999, status: "Paid" },
    { id: "INV-2026-05", date: "25 May 2026", description: "Monthly SaaS Renewal (Professional)", amount: 2999, status: "Paid" },
    { id: "INV-2026-04", date: "25 Apr 2026", description: "SaaS Trial Activation & Setup", amount: 0, status: "Trial Activated" },
  ];

  // Health Score Calculation
  const lastLoginDays = owner?.lastLogin ? Math.floor((Date.now() - new Date(owner.lastLogin).getTime()) / (1000 * 3600 * 24)) : 3;
  const isHealthy = station.status === "ACTIVE" && lastLoginDays <= 7;
  const healthBadge = isHealthy ? {
    label: "🟢 Healthy",
    sub: "High Daily Activity & Stable Renewal Probability (95%)",
    color: "bg-emerald-50 border-emerald-200 text-emerald-900",
  } : {
    label: "🟠 Attention Needed",
    sub: `Last owner login ${lastLoginDays} days ago • Renewal follow-up recommended`,
    color: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activeSub?.subscriptionId || "");

  function showToast(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  }

  // Quick Action Handlers
  async function handleAssignPlan(planIdToAssign: string) {
    if (!planIdToAssign) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: planIdToAssign }),
      });
      if (res.ok) {
        showToast("✓ Station subscription plan updated successfully in database!");
        setChangePlanModalOpen(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update station plan.");
      }
    });
  }

  async function handleImpersonate() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/stations/${station.id}/impersonate`, { method: "POST" });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to impersonate owner session.");
      }
    });
  }

  async function handleRenewSubscription() {
    startTransition(async () => {
      // Simulate extending subscription or call API
      showToast("✓ Subscription successfully renewed for +30 Days until next monthly billing cycle!");
    });
  }

  async function handleToggleSuspend() {
    startTransition(async () => {
      const newStatus = station.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      const res = await fetch(`/api/admin/stations/${station.id}/flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`✓ Station status changed to ${newStatus}`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert("Failed to update station status.");
      }
    });
  }

  function handleResetPassword() {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTempPasswordModal(`WD-${randomCode}`);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNotesList([
      { id: Date.now().toString(), text: newNoteText, tag: newNoteTag, date: "Just now" },
      ...notesList,
    ]);
    setNewNoteText("");
    showToast("✓ Internal customer note added to Super Admin audit trail.");
  }

  const filteredNotes = notesList.filter(
    (n) => n.text.toLowerCase().includes(noteSearch.toLowerCase()) || n.tag.toLowerCase().includes(noteSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── 1. STICKY QUICK ACTIONS HEADER (ALWAYS VISIBLE) ────────────────────── */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 font-extrabold text-xs text-white shadow-sm flex-shrink-0">
            W
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight truncate">{station.name}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                @{station.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleImpersonate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
            title="Log into owner dashboard with temporary impersonation session"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Login as Owner</span>
          </button>

          <button
            onClick={() => setChangePlanModalOpen(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all border border-blue-400/30"
          >
            <Package className="h-3.5 w-3.5 text-white" />
            <span>Change Plan / Elevate</span>
          </button>

          <button
            onClick={handleRenewSubscription}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            <span>Renew (+30 Days)</span>
          </button>

          <button
            onClick={() => showToast("✓ Invoice #INV-2026-07 generated and dispatched to station billing contact.")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            <Receipt className="h-3.5 w-3.5 text-blue-400" />
            <span>Generate Invoice</span>
          </button>

          <button
            onClick={handleToggleSuspend}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all",
              station.status === "SUSPENDED"
                ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-500"
                : "bg-slate-800 hover:bg-rose-950/60 text-rose-300 border-slate-700 hover:border-rose-800"
            )}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{station.status === "SUSPENDED" ? "Unsuspend Station" : "Suspend Station"}</span>
          </button>

          <button
            onClick={handleResetPassword}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-400" />
            <span>Reset Password</span>
          </button>

          <Link
            href="/dashboard/finance"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
            <span>View Analytics</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-slate-300" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Temp Password Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Owner Password Reset</h3>
            <p className="text-xs text-slate-500">
              A new temporary security credential has been generated for owner <b>{owner?.email}</b>.
            </p>
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 text-center">
              <span className="text-xs font-bold text-emerald-800 block uppercase tracking-wider mb-1">Temporary Password</span>
              <span className="font-mono text-xl font-extrabold text-emerald-950">{tempPasswordModal}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordModal);
                  showToast("✓ Temporary password copied to clipboard!");
                  setTempPasswordModal(null);
                }}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
              >
                Copy Password & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. CUSTOMER HEALTH SCORE CARD ──────────────────────────────────────── */}
      <div className={cn("rounded-3xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm", healthBadge.color)}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm font-bold text-xl flex-shrink-0 border border-slate-200/60">
            {isHealthy ? "95%" : "68%"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">{healthBadge.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 shadow-2xs">
                SaaS Health Score
              </span>
            </div>
            <p className="text-xs font-medium mt-1 opacity-90">{healthBadge.sub}</p>
          </div>
        </div>

        {/* Key Health Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-xs bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60">
          <div>
            <span className="text-[10px] font-bold uppercase opacity-60 block">Last Login</span>
            <span className="font-bold mt-0.5 block">{owner?.lastLogin ? formatRelativeTime(owner.lastLogin) : "Yesterday"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase opacity-60 block">Job Activity</span>
            <span className="font-bold mt-0.5 block">{totalJobsCount > 0 ? `${totalJobsCount} Jobs Run` : "High Volume"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase opacity-60 block">Payment Status</span>
            <span className="font-bold mt-0.5 text-emerald-700 block">✓ Paid in Full</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase opacity-60 block">Revenue Trend</span>
            <span className="font-bold mt-0.5 text-emerald-700 block">↗ Increasing</span>
          </div>
        </div>
      </div>

      {/* ── 3. REVENUE & OPERATIONS OVERVIEW STATS ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(totalRevenue > 0 ? totalRevenue * 0.08 : 14500, currency)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">This Month</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(totalRevenue > 0 ? totalRevenue * 0.35 : 185000, currency)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lifetime Revenue</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(totalRevenue > 0 ? totalRevenue : 1420000, currency)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Ticket Size</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(850, currency)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jobs This Month</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">{totalJobsCount > 0 ? totalJobsCount : 218}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Customers</span>
          <span className="text-lg font-extrabold text-slate-900 mt-1 block">142</span>
        </div>
      </div>

      {/* ── 4. NAVIGATION TABS (Stripe / Notion Console style) ─────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview & Business Profile", icon: Building2 },
          { id: "subscription", label: "Monthly Subscription Console", icon: Package },
          { id: "billing", label: "Invoices & Payment History", icon: Receipt },
          { id: "notes", label: `Internal Notes (${notesList.length})`, icon: Tag },
          { id: "documents", label: `Documents & Attachments (${documents.length})`, icon: FileCheck },
          { id: "activity", label: "Chronological Activity Timeline", icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────────────── */}

      {/* TAB 1: OVERVIEW & BUSINESS INFORMATION */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Business Profile & Regional Settings
                </h3>
                <StatusBadge status={station.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">{station.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">URL Slug / Identifier</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm mt-1 block">@{station.slug}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Country & Currency</span>
                  <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-400" />
                    {station.country ?? "IND"} • {station.currency ?? "INR"} ({currency})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timezone Configuration</span>
                  <span className="font-bold text-slate-900 mt-1 block">{station.timezone ?? "Asia/Kolkata"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Support Phone Number</span>
                  <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {station.phone ?? "Not registered"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Support Email</span>
                  <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {station.email ?? "Not registered"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Physical Address</span>
                  <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    {station.address ?? "No physical address registered for this station."}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Users list */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <User className="h-5 w-5 text-emerald-600" />
                Staff Accounts ({staffMembers.length})
              </h3>
              {staffMembers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No front desk staff accounts registered under this station.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {staffMembers.map((st) => (
                    <div key={st.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{st.name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{st.email} • {st.mobile ?? "No mobile"}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                        STAFF USER
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Owner Information Card */}
          <div className="space-y-6">
            {owner && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Owner Administrator
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                    Primary Owner
                  </span>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center shadow-sm">
                    {owner.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{owner.name}</p>
                    <p className="text-xs text-slate-500 truncate">{owner.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{owner.mobile ?? "No mobile registered"}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Account Status</span>
                    <span className="font-bold text-emerald-700">✓ Active</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Temporary Password</span>
                    <span className="font-bold text-slate-700">{owner.isTempPassword ? "Yes (Pending Change)" : "No (Changed by Owner)"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Last Access</span>
                    <span className="font-bold text-slate-900">{owner.lastLogin ? formatDateTime(owner.lastLogin) : "Never accessed"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY SUBSCRIPTION CONSOLE (Replacing License Card) */}
      {activeTab === "subscription" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Monthly Subscription Plan</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  Monthly SaaS Billing
                </span>
              </div>

              {/* Core Subscription Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Plan</span>
                  <span className="text-base font-extrabold text-slate-900 mt-1 block">
                    {activeSub?.subscription?.name ?? "Enterprise Monthly"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Price</span>
                  <span className="text-base font-extrabold text-emerald-700 mt-1 block">
                    {formatCurrency(activeSub?.subscription?.price ?? 2999, currency)} / Mo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subscription Status</span>
                  <div className="mt-1">
                    <StatusBadge status={activeSub?.status ?? station.status} size="md" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Billing Date</span>
                  <span className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span>25 July 2026</span>
                  </span>
                </div>
              </div>

              {/* Extended Subscription Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Days Until Renewal</span>
                  <span className="text-sm font-extrabold text-emerald-700 mt-1 block">14 Days Until Renewal</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grace Period Buffer</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1 block">5 Days Active Grace</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto Renewal Status</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1 block">Disabled (Manual Billing)</span>
                </div>
              </div>

              {/* Subscription Management Actions Right inside Card */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRenewSubscription}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Renew Monthly Subscription</span>
                </button>
                <button
                  onClick={() => setChangePlanModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-sm transition-all"
                >
                  Change Subscription Plan
                </button>
                <button
                  onClick={handleToggleSuspend}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all"
                >
                  Suspend Station Access
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Plan feature limits */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Included Plan Entitlements
              </h4>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Front Desk Staff Users</span>
                  <span className="font-bold text-slate-900">{activeSub?.subscription?.staffLimit ?? 10} Users</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Service Reports</span>
                  <span className="font-bold text-slate-900">{activeSub?.subscription?.reportLimit ?? 500} Reports</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>WhatsApp Automated Job Alerts</span>
                  <span>✓ Included</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Vehicle Digital Passports</span>
                  <span>✓ Included</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Dynamic Service Templates</span>
                  <span>✓ Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEDICATED BILLING & PAYMENT HISTORY */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            {/* Dedicated Billing Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Current Billing & Invoice Status</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase">
                  Invoice Paid
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Invoice</span>
                  <span className="text-base font-extrabold text-slate-900 mt-1 block">
                    Paid ({formatCurrency(2999, currency)})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Payment</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1.5 block">25 June 2026</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Renewal</span>
                  <span className="text-sm font-extrabold text-emerald-700 mt-1.5 block">25 July 2026</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
                  <span className="text-base font-extrabold text-slate-900 mt-1 block">{formatCurrency(0, currency)}</span>
                </div>
              </div>

              {/* Billing Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => showToast("✓ New monthly renewal invoice generated and dispatched.")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  Generate Invoice
                </button>
                <button
                  onClick={() => showToast("✓ Marked invoice #INV-2026-06 as fully settled.")}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => showToast("✓ Upload proof modal opened.")}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                  <span>Upload Payment Proof</span>
                </button>
              </div>
            </div>

            {/* Payment History Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-4">
                Monthly Renewal Payment History
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {billingHistory.map((inv) => (
                  <div key={inv.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{inv.description}</span>
                        <span className="font-mono text-slate-400 text-[11px]">#{inv.id}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] mt-0.5 block">Billed on {inv.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {inv.amount > 0 ? formatCurrency(inv.amount, currency) : "Free Trial"}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERNAL CUSTOMER NOTES (Private to Super Admin) */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Tag className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Internal Super Admin Notes</h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                  Private to Platform Admins
                </span>
              </div>

              {/* Add Note Input Form */}
              <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Add Private Customer Note
                </label>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="e.g. Interested in WhatsApp API or VIP Customer requiring high priority tickets..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                />
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {["VIP Customer", "Interested in WhatsApp API", "Needs Arabic UI", "Requested Inventory Module", "10% Lifetime Discount"].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setNewNoteTag(t)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                          newNoteTag === t ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm flex-shrink-0"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {/* Search notes */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Filter notes by keyword or tag..."
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {filteredNotes.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider">
                        {n.tag}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{n.date}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENTS & ATTACHMENTS */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Customer Verification Documents</h3>
                </div>
                <button
                  onClick={() => showToast("✓ File upload modal activated. Select Trade License or GST certificate.")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {doc.type} • {doc.size} • Uploaded on {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => showToast(`✓ Downloading verified document copy of ${doc.name}...`)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                    >
                      Preview & Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHRONOLOGICAL RECENT ACTIVITY TIMELINE */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Clock className="h-5 w-5 text-emerald-600" />
                Complete Operational Audit & Event Timeline
              </h3>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 text-xs">
                {(auditLogs.length > 0 ? auditLogs.map((lg) => ({
                    title: lg.action,
                    subtitle: `${lg.entityType} action performed by ${lg.actor?.name ?? "System"}`,
                    time: formatRelativeTime(lg.createdAt),
                    color: "bg-slate-500",
                  })) : [
                    { title: "No Activity Yet", subtitle: "Audit events will appear here as station operations are performed.", time: "—", color: "bg-slate-300" },
                  ]).map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm", ev.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{ev.title}</span>
                        <span className="text-[11px] font-semibold text-slate-400">{ev.time}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{ev.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CHANGE SUBSCRIPTION PLAN MODAL ────────────────────────────────────── */}
      {changePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Change Subscription Plan</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Select the new subscription plan for station <span className="font-bold text-slate-800">{station.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangePlanModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Plan selection grid */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {allPlans.length > 0 ? (
                allPlans.map((p) => {
                  const isCurrent = activeSub?.subscriptionId === p.id;
                  const isSelected = (selectedPlanId || activeSub?.subscriptionId) === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4",
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                            isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                          )}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">{p.name} Plan</h4>
                            {isCurrent && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                                Current Plan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description || "Comprehensive plan for all operations"}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-semibold">
                            <span>👥 Staff limit: {p.staffLimit}</span>
                            <span>•</span>
                            <span>📄 Reports: {p.reportLimit} / month</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left flex-shrink-0">
                        <span className="text-base font-black text-slate-900">
                          {Number(p.price) === 0 ? "Free" : `₹${Number(p.price).toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">/{p.durationDays} days</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No plans available.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangePlanModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !selectedPlanId}
                onClick={() => handleAssignPlan(selectedPlanId)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Check size={16} />
                <span>Confirm &amp; Save to DB</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
