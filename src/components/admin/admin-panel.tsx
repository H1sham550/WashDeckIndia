"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  ShieldCheck,
  CreditCard,
  History,
  TrendingUp,
  Award,
  Users,
  Car,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  X,
  BarChart3,
  PieChart,
  Activity,
  Percent,
  Coins,
  Download,
  Globe
} from "lucide-react";

type FeatureFlag = {
  featureKey: string;
  isEnabled: boolean;
};

type StationSubscription = {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  graceUntil: string | null;
  status: string;
};

type AdminStation = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  upiId: string | null;
  gstNumber: string | null;
  featureFlags: FeatureFlag[];
  stationSubscriptions: StationSubscription[];
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  maxStaff: number;
  maxReports: number;
  description: string | null;
  trialDays: number;
  features: any;
  isRecommended: boolean;
  isActive: boolean;
  createdAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  metadataJson: any;
  station: { name: string } | null;
  actor: { name: string; role: string } | null;
};

type PlatformMetrics = {
  totalStations: number;
  activeStations: number;
  trialStations: number;
  suspendedStations: number;
  totalRevenue: number;
  totalJobsCount: number;
  totalVehiclesCount: number;
};

type AdminPanelProps = {
  initialStations: AdminStation[];
  initialPlans: Plan[];
  initialAuditLogs: AuditLog[];
  metrics: PlatformMetrics;
};

export function AdminPanel({ initialStations, initialPlans, initialAuditLogs, metrics }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"stations" | "plans" | "logs" | "analytics">("stations");
  
  // States
  const [stations, setStations] = useState<AdminStation[]>(initialStations);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [logs, setLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Search state for SaaS Sales Ledger
  const [saasSearch, setSaasSearch] = useState("");

  // DYNAMIC COMPUTE FOR SAAS COMPANY PERFORMANCE
  // 1. Flatten all subscription records into a single sales ledger
  const allTransactions = React.useMemo(() => {
    return stations.flatMap((station) => {
      return station.stationSubscriptions.map((sub) => {
        const plan = plans.find((p) => p.id === sub.subscriptionId);
        const price = plan ? Number(plan.price) : 0;
        const planName = plan ? plan.name : "Unknown Plan";
        return {
          id: sub.id,
          stationId: station.id,
          stationName: station.name,
          planName,
          price,
          startDate: new Date(sub.startDate),
          endDate: new Date(sub.endDate),
          status: sub.status,
          durationDays: plan ? plan.durationDays : 30,
        };
      });
    }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [stations, plans]);

  // 2. Total SaaS Company Lifetime Revenue
  const totalSaaSLifetimeRevenue = React.useMemo(() => {
    return allTransactions.reduce((acc, tx) => acc + tx.price, 0);
  }, [allTransactions]);

  // 3. Monthly Recurring Revenue (MRR) of active paid subscriptions
  const totalActiveMRR = React.useMemo(() => {
    return stations.reduce((acc, station) => {
      if (station.status === "SUSPENDED") return acc;
      const activeSub = station.stationSubscriptions.find(
        (sub) => sub.status === "ACTIVE" || sub.status === "GRACE"
      );
      if (!activeSub) return acc;
      const plan = plans.find((p) => p.id === activeSub.subscriptionId);
      if (!plan || Number(plan.price) <= 0) return acc;
      const duration = plan.durationDays || 30;
      const monthlyPrice = (Number(plan.price) / duration) * 30;
      return acc + monthlyPrice;
    }, 0);
  }, [stations, plans]);

  // 4. Average Revenue Per Station (ARPU)
  const arpu = React.useMemo(() => {
    const totalStationsCount = stations.length;
    return totalStationsCount > 0 ? totalSaaSLifetimeRevenue / totalStationsCount : 0;
  }, [stations, totalSaaSLifetimeRevenue]);

  // 5. Count of active paid subscriptions
  const activePaidSubscriptionsCount = React.useMemo(() => {
    return stations.filter((s) => {
      if (s.status === "SUSPENDED") return false;
      const activeSub = s.stationSubscriptions.find(
        (sub) => sub.status === "ACTIVE" || sub.status === "GRACE"
      );
      if (!activeSub) return false;
      const plan = plans.find((p) => p.id === activeSub.subscriptionId);
      return plan ? Number(plan.price) > 0 : false;
    }).length;
  }, [stations, plans]);

  // 6. 6-Month Historical Monthly Revenue dataset
  const monthlyRevenueData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const year = d.getFullYear();
      const month = d.getMonth();

      const monthlyRev = allTransactions
        .filter((tx) => {
          const txDate = tx.startDate;
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.price, 0);

      data.push({ label: monthLabel, revenue: monthlyRev });
    }
    return data;
  }, [allTransactions]);

  // 7. Plan Distribution Breakdown
  const planDistribution = React.useMemo(() => {
    return plans.map((plan) => {
      const activeTenants = stations.filter((s) => {
        const activeSub = s.stationSubscriptions[0];
        return (
          activeSub &&
          activeSub.subscriptionId === plan.id &&
          (activeSub.status === "ACTIVE" || activeSub.status === "GRACE") &&
          s.status !== "SUSPENDED"
        );
      }).length;

      const planLifetimeRev = allTransactions
        .filter((tx) => tx.planName === plan.name)
        .reduce((sum, tx) => sum + tx.price, 0);

      return {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        activeTenants,
        lifetimeRevenue: planLifetimeRev,
      };
    }).sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue);
  }, [plans, stations, allTransactions]);
  
  // Search / Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [processingFlags, setProcessingFlags] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [createStationModal, setCreateStationModal] = useState(false);
  const [editStationModal, setEditStationModal] = useState<AdminStation | null>(null);
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState<Plan | null>(null);

  // Form states - Create Station
  const [newStation, setNewStation] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    upiId: "",
    gstNumber: "",
    brandColor: "#0f766e",
    logoUrl: "",
    ownerName: "",
    ownerEmail: "",
    ownerMobile: "",
    subscriptionId: "",
    trialDays: "30",
    status: "TRIAL",
  });

  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword: string;
    stationName: string;
  } | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to upload logo.");
      }

      setNewStation((prev) => ({ ...prev, logoUrl: result.url }));
    } catch (err: any) {
      alert(err.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  // Form states - Edit Station Grace/Plan/Details
  const [editStationDetails, setEditStationDetails] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    upiId: "",
    gstNumber: "",
    status: "",
    graceUntil: "",
    subscriptionId: "",
  });

  // Form states - Plan Creation
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    durationDays: "30",
    maxStaff: "5",
    maxReports: "100",
    description: "",
    trialDays: "0",
    features: { offers: true, reports: true, analytics: true, recovery: true },
    isRecommended: false,
    isActive: true,
  });

  // Filter stations
  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(search.toLowerCase()) ||
      station.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === "ALL" || station.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Helper for patching station
  async function patchStation(stationId: string, body: any) {
    setUpdatingId(stationId);
    try {
      const response = await fetch(`/api/admin/stations/${stationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update station.");
      }

      const res = await response.json();
      if (res.ok && res.station) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === stationId
              ? {
                  ...s,
                  name: res.station.name,
                  slug: res.station.slug,
                  phone: res.station.phone,
                  email: res.station.email,
                  address: res.station.address,
                  upiId: res.station.upiId,
                  gstNumber: res.station.gstNumber,
                  status: res.station.status,
                  stationSubscriptions: res.station.stationSubscriptions,
                }
              : s
          )
        );
        return true;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
    return false;
  }

  // Impersonate handler
  async function handleImpersonate(stationId: string) {
    setUpdatingId(stationId);
    try {
      const res = await fetch(`/api/admin/stations/${stationId}/impersonate`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to log in as station.");
      }
      // Redirect to operations dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message);
      setUpdatingId(null);
    }
  }

  // Toggle Feature Flag
  async function handleToggleFlag(stationId: string, featureKey: string, currentEnabled: boolean) {
    const updatedEnabled = !currentEnabled;
    const key = `${stationId}_${featureKey}`;

    // Prevent double clicking / concurrent updates
    if (processingFlags[key]) return;

    setProcessingFlags((prev) => ({ ...prev, [key]: true }));

    // Optimistic UI update
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === stationId) {
          const exists = s.featureFlags.some((ff) => ff.featureKey === featureKey);
          const newFlags = exists
            ? s.featureFlags.map((ff) => (ff.featureKey === featureKey ? { ...ff, isEnabled: updatedEnabled } : ff))
            : [...s.featureFlags, { featureKey, isEnabled: updatedEnabled }];
          return { ...s, featureFlags: newFlags };
        }
        return s;
      })
    );

    try {
      const res = await fetch(`/api/admin/stations/${stationId}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey, isEnabled: updatedEnabled }),
      });
      if (!res.ok) throw new Error();

      // Show success toast
      setToast({
        message: updatedEnabled ? "Feature Enabled" : "Feature Disabled",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch {
      // Revert on error
      setStations((prev) =>
        prev.map((s) => {
          if (s.id === stationId) {
            return {
              ...s,
              featureFlags: s.featureFlags.map((ff) =>
                ff.featureKey === featureKey ? { ...ff, isEnabled: currentEnabled } : ff
              ),
            };
          }
          return s;
        })
      );
      setToast({ message: "Failed to update feature flag override.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessingFlags((prev) => ({ ...prev, [key]: false }));
    }
  }

  // Suspend/Activate Toggle
  async function handleStatusToggle(stationId: string, currentStatus: string) {
    const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await patchStation(stationId, { status: newStatus });
  }

  // Soft Delete Station
  async function handleDeleteStation(stationId: string) {
    if (!confirm("Are you sure you want to delete this station? This will soft delete all station details.")) {
      return;
    }
    setUpdatingId(stationId);
    try {
      const res = await fetch(`/api/admin/stations/${stationId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete station.");
      }
      setStations((prev) => prev.filter((s) => s.id !== stationId));
      alert("Station soft deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  // Create Station submit
  async function handleCreateStationSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStation),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create station.");
      }

      const data = await res.json();
      if (data.ok && data.tempPassword) {
        setCreatedCredentials({
          email: data.owner.email,
          tempPassword: data.tempPassword,
          stationName: data.station.name,
        });

        // Reset form
        setNewStation({
          name: "",
          slug: "",
          phone: "",
          email: "",
          upiId: "",
          gstNumber: "",
          brandColor: "#0f766e",
          logoUrl: "",
          ownerName: "",
          ownerEmail: "",
          ownerMobile: "",
          subscriptionId: "",
          trialDays: "30",
          status: "TRIAL",
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Edit Station modal open
  function openEditStation(station: AdminStation) {
    setEditStationModal(station);
    const activeSub = station.stationSubscriptions[0];
    const graceDateStr = activeSub?.graceUntil ? new Date(activeSub.graceUntil).toISOString().split("T")[0] : "";

    setEditStationDetails({
      name: station.name,
      slug: station.slug,
      phone: station.phone || "",
      email: station.email || "",
      address: station.address || "",
      upiId: station.upiId || "",
      gstNumber: station.gstNumber || "",
      status: station.status,
      graceUntil: graceDateStr,
      subscriptionId: "",
    });
  }

  // Edit Station submit
  async function handleEditStationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStationModal) return;

    const payload: any = {
      name: editStationDetails.name,
      slug: editStationDetails.slug,
      phone: editStationDetails.phone,
      email: editStationDetails.email,
      address: editStationDetails.address,
      upiId: editStationDetails.upiId,
      gstNumber: editStationDetails.gstNumber,
      status: editStationDetails.status,
      graceUntil: editStationDetails.graceUntil ? new Date(editStationDetails.graceUntil).toISOString() : null,
    };

    if (editStationDetails.subscriptionId) {
      payload.subscriptionId = editStationDetails.subscriptionId;
    }

    const success = await patchStation(editStationModal.id, payload);
    if (success) {
      setEditStationModal(null);
      alert("Station configurations updated successfully.");
    }
  }

  // Create Plan submit
  async function handleCreatePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create plan.");
      }

      const data = await res.json();
      if (data.ok && data.plan) {
        setPlans((prev) => [data.plan, ...prev]);
        setCreatePlanModal(false);
        setNewPlan({
          name: "",
          price: "",
          durationDays: "30",
          maxStaff: "5",
          maxReports: "100",
          description: "",
          trialDays: "0",
          features: { offers: true, reports: true, analytics: true, recovery: true },
          isRecommended: false,
          isActive: true,
        });
        alert("Subscription plan created successfully.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Edit Plan submit
  async function handleEditPlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPlanModal) return;

    try {
      const res = await fetch(`/api/admin/plans/${editPlanModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPlanModal),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update plan.");
      }

      const data = await res.json();
      if (data.ok && data.plan) {
        setPlans((prev) => prev.map((p) => (p.id === editPlanModal.id ? data.plan : p)));
        setEditPlanModal(null);
        alert("Subscription plan updated successfully.");
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Delete Plan submit
  async function handleDeletePlan(planId: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete plan.");
      }
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      alert("Plan deleted successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Render status helper
  function renderStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case "TRIAL":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
            <ShieldCheck size={12} />
            Trial
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle size={12} />
            Expired
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle size={12} />
            Suspended
          </span>
        );
      default:
        return <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{status}</span>;
    }
  }

  return (
    <div className="space-y-6" style={{ "--primary-color": "#0f172a" } as React.CSSProperties}>
      {/* 1. Global Platform Metrics Strip */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Stations</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{metrics.totalStations}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">SaaS Company Rev</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">₹{totalSaaSLifetimeRevenue}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
            <Car size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Job Cards</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{metrics.totalJobsCount}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Carwash Operations Rev</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">₹{metrics.totalRevenue}</p>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("stations")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "stations"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Stations & Tenants ({stations.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "plans"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Subscription Licensing Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "logs"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Platform Audit Logs
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "analytics"
              ? "border-[var(--primary-color)] text-[var(--primary-color)]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Platform Business Analytics
        </button>
      </div>

      {/* TABS VIEW CONTROLLERS */}

      {/* A. STATIONS TAB */}
      {activeTab === "stations" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search stations by name or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto shrink-0 flex-wrap justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold border rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <button
                onClick={() => setCreateStationModal(true)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-color)] hover:opacity-95 text-white text-xs font-bold px-4 transition shadow-sm"
              >
                <Plus size={16} />
                Create Station
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => {
                const activeSub = station.stationSubscriptions[0];
                const offersFlag = station.featureFlags.find((f) => f.featureKey === "offers")?.isEnabled ?? true;
                const reportsFlag = station.featureFlags.find((f) => f.featureKey === "reports")?.isEnabled ?? true;
                const analyticsFlag = station.featureFlags.find((f) => f.featureKey === "analytics")?.isEnabled ?? true;
                const recoveryFlag = station.featureFlags.find((f) => f.featureKey === "recovery")?.isEnabled ?? true;

                const daysLeft = activeSub
                  ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;

                const isSuspended = station.status === "SUSPENDED";

                return (
                  <div
                    key={station.id}
                    className={`bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-12 hover:shadow-md transition-all ${
                      isSuspended ? "opacity-75 bg-slate-50/50" : ""
                    } ${updatingId === station.id ? "pointer-events-none opacity-50" : ""}`}
                  >
                    {/* col-span-4: Station info & Meta */}
                    <div className="p-5 md:col-span-4 border-b md:border-b-0 md:border-r space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded border text-slate-500 font-extrabold text-sm uppercase">
                              {station.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-sm tracking-wide">{station.name}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">/{station.slug}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditStation(station)}
                              title="Edit Station Configurations"
                              className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-400 hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all bg-white"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteStation(station.id)}
                              title="Soft Delete Station"
                              className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all bg-white"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {renderStatusBadge(station.status)}
                          <span className="text-[10px] text-slate-400 font-medium">
                            Joined {new Date(station.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        {station.users.length > 0 ? (
                          <div className="space-y-1 bg-slate-50/70 border rounded-lg p-2.5 text-xs font-semibold text-slate-600">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Owner Account</span>
                            <p className="truncate text-slate-700">{station.users[0].name}</p>
                            <p className="truncate text-[10px] text-slate-400 font-medium">{station.users[0].email}</p>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-500 font-semibold italic bg-rose-50 p-2 rounded-lg border border-rose-100">
                            No Owner user associated.
                          </div>
                        )}
                      </div>

                      {/* Impersonate & Suspend actions */}
                      <div className="pt-3 border-t flex gap-2">
                        <button
                          onClick={() => handleImpersonate(station.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 transition shadow-sm"
                        >
                          <ArrowRightLeft size={12} />
                          Login As Station
                        </button>
                        <button
                          onClick={() => handleStatusToggle(station.id, station.status)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-white text-xs font-bold px-3 transition shadow-sm ${
                            isSuspended ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          {isSuspended ? <Play size={12} /> : <Pause size={12} />}
                          {isSuspended ? "Activate" : "Suspend"}
                        </button>
                      </div>
                    </div>

                    {/* col-span-5: Subscription Detail */}
                    <div className="p-5 md:col-span-5 border-b md:border-b-0 md:border-r space-y-4">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subscription License</h5>

                      {activeSub ? (
                        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border text-xs font-semibold">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>License Duration:</span>
                            <span className="font-extrabold text-slate-800">
                              {new Date(activeSub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} -{" "}
                              {new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600">
                            <span>Time Remaining:</span>
                            <span className={`font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                              daysLeft > 10 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {daysLeft} Days Left
                            </span>
                          </div>

                          {activeSub.graceUntil && (
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Grace Period Extended:</span>
                              <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                                Until {new Date(activeSub.graceUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-700 italic font-semibold">
                          No active subscription license registered for this station.
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        To extend this station's licensing period or modify grace intervals, click the edit gear <Edit2 size={10} className="inline" /> icon in station details.
                      </div>
                    </div>

                    {/* col-span-3: Feature Flags overrides */}
                    <div className="p-5 md:col-span-3 space-y-4">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Features Authorized</h5>

                      <div className="space-y-3 pt-1">
                        {/* Loyalty Offers Row */}
                        <div
                          onClick={() => {
                            if (!processingFlags[`${station.id}_offers`]) {
                              handleToggleFlag(station.id, "offers", offersFlag);
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition active:scale-[0.99] duration-100"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Loyalty Offers</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">Stamp systems & rewards</span>
                          </div>
                          <Switch
                            checked={offersFlag}
                            disabled={!!processingFlags[`${station.id}_offers`]}
                            onCheckedChange={() => handleToggleFlag(station.id, "offers", offersFlag)}
                          />
                        </div>

                        {/* Service Reports Row */}
                        <div
                          onClick={() => {
                            if (!processingFlags[`${station.id}_reports`]) {
                              handleToggleFlag(station.id, "reports", reportsFlag);
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition active:scale-[0.99] duration-100"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Service Reports</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">Public report sharing link</span>
                          </div>
                          <Switch
                            checked={reportsFlag}
                            disabled={!!processingFlags[`${station.id}_reports`]}
                            onCheckedChange={() => handleToggleFlag(station.id, "reports", reportsFlag)}
                          />
                        </div>

                        {/* Analytics Row */}
                        <div
                          onClick={() => {
                            if (!processingFlags[`${station.id}_analytics`]) {
                              handleToggleFlag(station.id, "analytics", analyticsFlag);
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition active:scale-[0.99] duration-100"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Analytics Dashboard</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">Popular services & revenue charts</span>
                          </div>
                          <Switch
                            checked={analyticsFlag}
                            disabled={!!processingFlags[`${station.id}_analytics`]}
                            onCheckedChange={() => handleToggleFlag(station.id, "analytics", analyticsFlag)}
                          />
                        </div>

                        {/* Revenue Recovery Row */}
                        <div
                          onClick={() => {
                            if (!processingFlags[`${station.id}_recovery`]) {
                              handleToggleFlag(station.id, "recovery", recoveryFlag);
                            }
                          }}
                          className="flex items-center justify-between cursor-pointer select-none p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition active:scale-[0.99] duration-100"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Revenue Recovery</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">Payment reminders & recovery</span>
                          </div>
                          <Switch
                            checked={recoveryFlag}
                            disabled={!!processingFlags[`${station.id}_recovery`]}
                            onCheckedChange={() => handleToggleFlag(station.id, "recovery", recoveryFlag)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border rounded-xl p-12 text-center text-slate-400 text-sm font-semibold">
                No stations match search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. PLANS TAB */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Subscription Plans Matrix</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Configure plans to easily assign fixed packages to stations.</p>
            </div>
            <button
              onClick={() => setCreatePlanModal(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-color)] hover:opacity-95 text-white text-xs font-bold px-4 transition shadow-sm"
            >
              <Plus size={16} />
              Create Plan
            </button>
          </div>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Plan Details</th>
                  <th className="px-6 py-4">Price & Trial</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Limits (Staff / Reports)</th>
                  <th className="px-6 py-4">Feature Access</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {plan.name}
                            {plan.isRecommended && (
                              <span className="inline-flex items-center text-[9px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                                Recommended
                              </span>
                            )}
                          </span>
                          {plan.description && (
                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 max-w-xs block leading-normal">
                              {plan.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">₹{Number(plan.price).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {plan.trialDays > 0 ? `${plan.trialDays} Trial Days` : "No Trial"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{plan.durationDays} Days</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{plan.maxStaff} Staff users</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{plan.maxReports} Reports</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(() => {
                            const features = plan.features || { offers: true, reports: true, analytics: true, recovery: true };
                            const list = [];
                            if (features.offers) list.push("Loyalty Offers");
                            if (features.reports) list.push("Service Reports");
                            if (features.analytics) list.push("Analytics");
                            if (features.recovery) list.push("Revenue Recovery");
                            if (list.length === 0) return <span className="text-slate-400 text-[10px]">None</span>;
                            return list.map((f, i) => (
                              <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {f}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {plan.isActive ? (
                          <span className="inline-flex items-center text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => setEditPlanModal(plan)}
                          className="h-8 w-8 rounded-lg border flex items-center justify-center text-slate-400 hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all bg-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="h-8 w-8 rounded-lg border flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all bg-white"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                      No subscription plans created yet. Click "Create Plan" to define one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. AUDIT LOGS TAB */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="bg-white p-4 border rounded-xl shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm">Platform Audit Trails</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Real-time actions, operations, and status changes logged globally.</p>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Station</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Entity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">{log.station?.name || "Global / System"}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.actor?.name || "System Process"}{" "}
                        {log.actor?.role && (
                          <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-400">
                            {log.actor.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-extrabold">{log.action}</td>
                      <td className="px-6 py-4 text-slate-400 text-[10px] truncate max-w-xs font-mono">
                        {log.entityType} ({log.entityId || "N/A"}){" "}
                        {log.metadataJson && JSON.stringify(log.metadataJson)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      No system events logged in audit trails.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* A. Secondary KPI Cards Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MRR</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity size={14} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">₹{totalActiveMRR.toFixed(2)}</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active recurring baseline</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ARPU (LTV)</span>
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Coins size={14} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">₹{arpu.toFixed(2)}</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Average value per tenant</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Paid Stations</span>
                <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 size={14} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">{activePaidSubscriptionsCount} / {stations.length}</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paid licenses vs. total tenants</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
                <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Percent size={14} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">
                  {stations.length > 0 ? ((activePaidSubscriptionsCount / stations.length) * 100).toFixed(1) : "0"}%
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ratio of paying customer base</p>
              </div>
            </div>
          </div>

          {/* B. Dynamic SVG Chart & Plan Distribution Grid */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Chart Column (col-span-7) */}
            <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-7 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">SaaS Revenue Growth Trend</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Monthly subscription sales over the last 6 months.</p>
              </div>

              <div className="w-full flex items-center justify-center pt-2">
                {(() => {
                  const maxRevenue = Math.max(...monthlyRevenueData.map((d) => d.revenue), 1000);
                  const width = 500;
                  const height = 220;
                  const paddingLeft = 45;
                  const paddingRight = 15;
                  const paddingTop = 25;
                  const paddingBottom = 35;
                  const chartWidth = width - paddingLeft - paddingRight;
                  const chartHeight = height - paddingTop - paddingBottom;

                  // Divisions for Y-axis
                  const divisions = 4;
                  const yLines = Array.from({ length: divisions + 1 }, (_, i) => i);

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[240px] overflow-visible">
                      {/* Grid Lines & Y-Axis Labels */}
                      {yLines.map((k) => {
                        const yVal = (maxRevenue / divisions) * k;
                        const yCoord = paddingTop + chartHeight - (k / divisions) * chartHeight;
                        return (
                          <g key={k}>
                            <line
                              x1={paddingLeft}
                              y1={yCoord}
                              x2={width - paddingRight}
                              y2={yCoord}
                              stroke="#e2e8f0"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                            />
                            <text
                              x={paddingLeft - 8}
                              y={yCoord + 3}
                              textAnchor="end"
                              className="text-[9px] fill-slate-400 font-bold"
                            >
                              ₹{Math.round(yVal)}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-Axis Month Labels & Bars */}
                      {monthlyRevenueData.map((d, idx) => {
                        const colWidth = chartWidth / monthlyRevenueData.length;
                        const barWidth = colWidth * 0.55;
                        const barHeight = (d.revenue / maxRevenue) * chartHeight;
                        const xCoord = paddingLeft + idx * colWidth + (colWidth - barWidth) / 2;
                        const yCoord = paddingTop + chartHeight - barHeight;

                        return (
                          <g key={idx} className="group">
                            {/* Bar Graphic with Gradient Fill */}
                            <rect
                              x={xCoord}
                              y={yCoord}
                              width={barWidth}
                              height={barHeight}
                              fill="#0f172a"
                              rx={3}
                              className="transition-all duration-200 hover:fill-slate-800"
                            />
                            {/* Label above Bar */}
                            {d.revenue > 0 && (
                              <text
                                x={xCoord + barWidth / 2}
                                y={yCoord - 6}
                                textAnchor="middle"
                                className="text-[8px] fill-slate-700 font-extrabold"
                              >
                                ₹{d.revenue}
                              </text>
                            )}
                            {/* Month X-Axis Label */}
                            <text
                              x={xCoord + barWidth / 2}
                              y={paddingTop + chartHeight + 18}
                              textAnchor="middle"
                              className="text-[9px] fill-slate-400 font-bold"
                            >
                              {d.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Base Axis Line */}
                      <line
                        x1={paddingLeft}
                        y1={paddingTop + chartHeight}
                        x2={width - paddingRight}
                        y2={paddingTop + chartHeight}
                        stroke="#94a3b8"
                        strokeWidth={1}
                      />
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Plan Distribution Column (col-span-5) */}
            <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-5 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Plan Popularity & Performance</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Distribution of active licenses & lifetime revenue.</p>
              </div>

              <div className="space-y-4 pt-1">
                {planDistribution.map((plan) => {
                  const revenuePercentage =
                    totalSaaSLifetimeRevenue > 0
                      ? (plan.lifetimeRevenue / totalSaaSLifetimeRevenue) * 100
                      : 0;

                  return (
                    <div key={plan.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{plan.name}</span>
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            ₹{Number(plan.price)}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px] font-bold">
                          {plan.activeTenants} Active Tenant{plan.activeTenants !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-800 h-full rounded-full transition-all duration-500"
                          style={{ width: `${revenuePercentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                        <span>{revenuePercentage.toFixed(1)}% revenue share</span>
                        <span className="text-slate-700">₹{plan.lifetimeRevenue} Lifetime</span>
                      </div>
                    </div>
                  );
                })}
                {planDistribution.length === 0 && (
                  <p className="text-center text-xs text-slate-400 italic py-6">No plan distribution details available.</p>
                )}
              </div>
            </div>
          </div>

          {/* C. SaaS Sales Ledger Table */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search ledger by station or plan..."
                  value={saasSearch}
                  onChange={(e) => setSaasSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] bg-slate-50/50"
                />
              </div>

              <button
                onClick={() => {
                  const headers = ["Activation Date", "Tenant Station", "Subscription Plan", "Amount (INR)", "Duration (Days)", "Expiry Date", "Status"];
                  const rows = allTransactions.map((tx) => [
                    tx.startDate.toISOString().split("T")[0],
                    `"${tx.stationName.replace(/"/g, '""')}"`,
                    `"${tx.planName.replace(/"/g, '""')}"`,
                    tx.price,
                    tx.durationDays,
                    tx.endDate.toISOString().split("T")[0],
                    tx.status,
                  ]);

                  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `WashDeck_SaaS_Sales_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full md:w-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 transition shadow-sm bg-white"
              >
                <Download size={14} />
                Export Ledger (CSV)
              </button>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Activation Date</th>
                    <th className="px-6 py-4">Tenant Station</th>
                    <th className="px-6 py-4">Subscription Plan</th>
                    <th className="px-6 py-4">Revenue Collected</th>
                    <th className="px-6 py-4">Licensing Period</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(() => {
                    const filteredTx = allTransactions.filter(
                      (tx) =>
                        tx.stationName.toLowerCase().includes(saasSearch.toLowerCase()) ||
                        tx.planName.toLowerCase().includes(saasSearch.toLowerCase())
                    );

                    if (filteredTx.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                            No subscription sales transactions found matching search criteria.
                          </td>
                        </tr>
                      );
                    }

                    return filteredTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {tx.startDate.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{tx.stationName}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{tx.planName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{tx.durationDays} Days validity</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-900">₹{tx.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {tx.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} -{" "}
                          {tx.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          {tx.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                              Active
                            </span>
                          ) : tx.status === "GRACE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                              Grace
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full border border-slate-200">
                              Expired
                            </span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STATION MODAL */}
      {createStationModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                {createdCredentials ? "Owner Credentials" : "Provision New Tenant Station"}
              </h3>
              <button
                onClick={() => {
                  if (createdCredentials) {
                    setCreatedCredentials(null);
                    window.location.reload();
                  } else {
                    setCreateStationModal(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {createdCredentials ? (
              <div className="p-6 text-center space-y-6 overflow-y-auto">
                <div className="inline-flex h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center border border-emerald-200">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Station Provisioned successfully!</h3>
                  <p className="text-xs text-slate-400 mt-1">Here are the primary owner login credentials. Displayed only once.</p>
                </div>

                <div className="bg-slate-50 border rounded-xl p-4 text-left font-semibold text-xs space-y-3.5 max-w-md mx-auto relative overflow-hidden">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider">Station Name</span>
                    <span className="text-slate-800 font-extrabold">{createdCredentials.stationName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider">Login Email</span>
                    <span className="text-slate-800 font-extrabold">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider">Temp Password</span>
                    <span className="text-rose-600 font-mono font-extrabold text-sm">{createdCredentials.tempPassword}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Station: ${createdCredentials.stationName}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}`
                      );
                      alert("Credentials copied to clipboard!");
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 transition"
                  >
                    Copy Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob(
                        [
                          `WashDesk Onboarding Credentials\n`,
                          `==============================\n`,
                          `Station Name: ${createdCredentials.stationName}\n`,
                          `Login Email:  ${createdCredentials.email}\n`,
                          `Temporary Password: ${createdCredentials.tempPassword}\n\n`,
                          `Please note: The owner will be required to change this temporary password upon first login.\n`,
                        ],
                        { type: "text/plain" }
                      );
                      element.href = URL.createObjectURL(file);
                      element.download = `${createdCredentials.stationName.replace(/\s+/g, "_")}_credentials.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 transition"
                  >
                    Download Credentials (.txt)
                  </button>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setCreateStationModal(false);
                      window.location.reload();
                    }}
                    className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStationSubmit} className="p-6 overflow-y-auto space-y-5">
                {/* Station Info Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">1. Station Details</h4>
                  <div className="grid gap-4 md:grid-cols-2 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Station Name *</label>
                      <input
                        type="text"
                        required
                        value={newStation.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const slugVal = val
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                          setNewStation((prev) => ({ ...prev, name: val, slug: slugVal }));
                        }}
                        placeholder="e.g. Apex Auto Wash"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Slug (Unique URL Subpath) *</label>
                      <input
                        type="text"
                        required
                        value={newStation.slug}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g. apex-auto-wash"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 bg-slate-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Contact Phone</label>
                      <input
                        type="text"
                        value={newStation.phone}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +91 99999 99999"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Contact Email</label>
                      <input
                        type="email"
                        value={newStation.email}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. contact@apex.com"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">UPI ID</label>
                      <input
                        type="text"
                        value={newStation.upiId}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, upiId: e.target.value }))}
                        placeholder="e.g. apex@upi"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">GST Number (Optional)</label>
                      <input
                        type="text"
                        value={newStation.gstNumber}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, gstNumber: e.target.value }))}
                        placeholder="e.g. 22AAAAA1111A1Z1"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Branding & Style Section */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">2. Branding & Appearance (Optional)</h4>
                  <div className="grid gap-4 md:grid-cols-2 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Brand Primary Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={newStation.brandColor}
                          onChange={(e) => setNewStation((prev) => ({ ...prev, brandColor: e.target.value }))}
                          className="h-8 w-12 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newStation.brandColor}
                          onChange={(e) => setNewStation((prev) => ({ ...prev, brandColor: e.target.value }))}
                          placeholder="#0f766e"
                          className="flex-1 px-3 py-1.5 border rounded-lg focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Logo Image</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="new-station-logo-file"
                          disabled={uploadingLogo}
                        />
                        <label
                          htmlFor="new-station-logo-file"
                          className="inline-flex h-9 items-center justify-center border rounded-lg px-4 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer font-bold select-none transition"
                        >
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                        </label>
                        {newStation.logoUrl && (
                          <div className="h-9 w-9 relative rounded border overflow-hidden bg-slate-50">
                            <img src={newStation.logoUrl} alt="Preview" className="h-full w-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Details Section */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">3. Subscription & Status</h4>
                  <div className="grid gap-4 md:grid-cols-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Subscription Plan *</label>
                      <select
                        required
                        value={newStation.subscriptionId}
                        onChange={(e) => {
                          const selectedPlanId = e.target.value;
                          const selectedPlan = plans.find((p) => p.id === selectedPlanId);
                          setNewStation((prev) => ({
                            ...prev,
                            subscriptionId: selectedPlanId,
                            trialDays: selectedPlan ? String(selectedPlan.trialDays) : "30",
                          }));
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white text-slate-700"
                      >
                        <option value="">-- Select Plan --</option>
                        {plans
                          .filter((p) => p.isActive)
                          .map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} (₹{plan.price})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Trial Days</label>
                      <input
                        type="number"
                        min="0"
                        value={newStation.trialDays}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, trialDays: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Station Status</label>
                      <select
                        value={newStation.status}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white text-slate-700"
                      >
                        <option value="TRIAL">Trial</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Owner Account Section */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">4. Primary Owner User</h4>
                  <div className="grid gap-4 md:grid-cols-2 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Owner Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newStation.ownerName}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, ownerName: e.target.value }))}
                        placeholder="e.g. Rajan Pillai"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Owner Login Email *</label>
                      <input
                        type="email"
                        required
                        value={newStation.ownerEmail}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, ownerEmail: e.target.value }))}
                        placeholder="e.g. owner@apex.com"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 mb-1 block">Owner Mobile Number</label>
                      <input
                        type="text"
                        value={newStation.ownerMobile}
                        onChange={(e) => setNewStation((prev) => ({ ...prev, ownerMobile: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCreateStationModal(false)}
                    className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm"
                  >
                    Provision Station
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL (Metadata + grace + plan assign) */}
      {editStationModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Edit Station Configurations</h3>
              <button onClick={() => setEditStationModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditStationSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Info fields */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Station Metadata</h4>
                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Station Name</label>
                    <input
                      type="text"
                      required
                      value={editStationDetails.name}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Slug Subpath</label>
                    <input
                      type="text"
                      required
                      value={editStationDetails.slug}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Phone</label>
                    <input
                      type="text"
                      value={editStationDetails.phone}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={editStationDetails.email}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">UPI ID</label>
                    <input
                      type="text"
                      value={editStationDetails.upiId}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, upiId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">GST Number</label>
                    <input
                      type="text"
                      value={editStationDetails.gstNumber}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, gstNumber: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Address</label>
                    <input
                      type="text"
                      value={editStationDetails.address}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Overall Status</label>
                    <select
                      value={editStationDetails.status}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white"
                    >
                      <option value="TRIAL">Trial</option>
                      <option value="ACTIVE">Active</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Licensing settings */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1">Subscription & grace extensions</h4>
                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Extended Grace Period Limit</label>
                    <input
                      type="date"
                      value={editStationDetails.graceUntil}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, graceUntil: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">Assign Subscription Plan</label>
                    <select
                      value={editStationDetails.subscriptionId}
                      onChange={(e) => setEditStationDetails((prev) => ({ ...prev, subscriptionId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white text-slate-700"
                    >
                      <option value="">-- No Change (Keep current package) --</option>
                      {plans
                        .filter(
                          (p) =>
                            p.isActive ||
                            p.id === editStationModal.stationSubscriptions[0]?.subscriptionId
                        )
                        .map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} (₹{plan.price} - {plan.durationDays} days)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditStationModal(null)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm"
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {createPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Create Subscription Plan Product</h3>
              <button onClick={() => setCreatePlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Professional Premium"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Plan Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Best choice for growing studios with multiple detail bays"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPlan.price}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 2999"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Validity (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlan.durationDays}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, durationDays: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Trial Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlan.trialDays}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, trialDays: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Max Allowed Staff *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlan.maxStaff}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, maxStaff: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Max Service Reports *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlan.maxReports}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, maxReports: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 py-2 border-y my-2 bg-slate-50 p-2.5 rounded-lg select-none">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.isRecommended}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, isRecommended: e.target.checked }))}
                    className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-4 w-4"
                  />
                  <span>Recommended Plan</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlan.isActive}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-4 w-4"
                  />
                  <span>Active Status</span>
                </label>
              </div>

              {/* Feature Access Checkboxes */}
              <div className="space-y-2">
                <span className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider block">Authorized Features</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 p-2.5 border rounded-lg select-none">
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.features.offers}
                      onChange={(e) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          features: { ...prev.features, offers: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Loyalty Offers</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.features.reports}
                      onChange={(e) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          features: { ...prev.features, reports: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Service Reports</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.features.analytics}
                      onChange={(e) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          features: { ...prev.features, analytics: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Analytics</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.features.recovery}
                      onChange={(e) =>
                        setNewPlan((prev) => ({
                          ...prev,
                          features: { ...prev.features, recovery: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Revenue Recovery</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setCreatePlanModal(false)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Edit Subscription Plan Product</h3>
              <button onClick={() => setEditPlanModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditPlanSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editPlanModal.name}
                  onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Plan Description</label>
                <textarea
                  value={editPlanModal.description || ""}
                  onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Best choice for growing studios with multiple detail bays"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPlanModal.price}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editPlanModal.durationDays}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, durationDays: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Trial Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlanModal.trialDays ?? 0}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, trialDays: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Max Allowed Staff</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editPlanModal.maxStaff}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, maxStaff: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 mb-1 block">Max Service Reports</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editPlanModal.maxReports}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, maxReports: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 py-2 border-y my-2 bg-slate-50 p-2.5 rounded-lg select-none">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPlanModal.isRecommended}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, isRecommended: e.target.checked }))}
                    className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-4 w-4"
                  />
                  <span>Recommended Plan</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPlanModal.isActive}
                    onChange={(e) => setEditPlanModal((prev: any) => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-4 w-4"
                  />
                  <span>Active Status</span>
                </label>
              </div>

              {/* Feature Access Checkboxes */}
              <div className="space-y-2">
                <span className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider block">Authorized Features</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 p-2.5 border rounded-lg select-none">
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true }).offers}
                      onChange={(e) => {
                        const features = editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true };
                        setEditPlanModal((prev: any) => ({
                          ...prev,
                          features: { ...features, offers: e.target.checked },
                        }));
                      }}
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Loyalty Offers</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true }).reports}
                      onChange={(e) => {
                        const features = editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true };
                        setEditPlanModal((prev: any) => ({
                          ...prev,
                          features: { ...features, reports: e.target.checked },
                        }));
                      }}
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Service Reports</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true }).analytics}
                      onChange={(e) => {
                        const features = editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true };
                        setEditPlanModal((prev: any) => ({
                          ...prev,
                          features: { ...features, analytics: e.target.checked },
                        }));
                      }}
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Analytics</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true }).recovery}
                      onChange={(e) => {
                        const features = editPlanModal.features || { offers: true, reports: true, analytics: true, recovery: true };
                        setEditPlanModal((prev: any) => ({
                          ...prev,
                          features: { ...features, recovery: e.target.checked },
                        }));
                      }}
                      className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] h-3.5 w-3.5"
                    />
                    <span>Revenue Recovery</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setEditPlanModal(null)}
                  className="h-9 rounded-lg border text-slate-500 px-4 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[var(--primary-color)] text-white px-5 hover:opacity-95 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
