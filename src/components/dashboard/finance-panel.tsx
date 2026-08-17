"use client";

import React, { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/currency";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Receipt,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Car
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type IncomeTransaction = {
  id: string;
  jobCardId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  paymentMethod: string;
  vehicleNumber: string;
  customerName: string;
  type: "INCOME";
};

type ExpenseTransaction = {
  id: string;
  title: string;
  category: "ELECTRICITY" | "WATER" | "SUPPLIES" | "UTILITIES" | "RENT" | "SALARIES" | "MARKETING" | "REPAIRS" | "OTHER";
  amount: number;
  date: string;
  notes: string;
  type: "EXPENSE";
};

type Transaction = IncomeTransaction | ExpenseTransaction;

type FinancePanelProps = {
  initialIncomes: IncomeTransaction[];
  initialExpenses: ExpenseTransaction[];
  primaryColor: string;
};

const EXPENSE_CATEGORIES = [
  { value: "ELECTRICITY", label: "Electricity Bill", color: "bg-amber-50 text-amber-700 border-amber-200", barColor: "bg-amber-500", hexColor: "#F59E0B" },
  { value: "WATER", label: "Water Bill / Supply", color: "bg-cyan-50 text-cyan-700 border-cyan-200", barColor: "bg-cyan-500", hexColor: "#06B6D4" },
  { value: "SUPPLIES", label: "Supplies & Chemicals", color: "bg-emerald-50 text-emerald-700 border-emerald-200", barColor: "bg-emerald-500", hexColor: "#10B981" },
  { value: "UTILITIES", label: "Internet & Phone Utilities", color: "bg-blue-50 text-blue-700 border-blue-200", barColor: "bg-blue-500", hexColor: "#3B82F6" },
  { value: "RENT", label: "Rent & Lease", color: "bg-indigo-50 text-indigo-700 border-indigo-200", barColor: "bg-indigo-500", hexColor: "#6366F1" },
  { value: "SALARIES", label: "Staff Salaries & Commissions", color: "bg-purple-50 text-purple-700 border-purple-200", barColor: "bg-purple-500", hexColor: "#A855F7" },
  { value: "MARKETING", label: "Marketing & Ads", color: "bg-pink-50 text-pink-700 border-pink-200", barColor: "bg-pink-500", hexColor: "#EC4899" },
  { value: "REPAIRS", label: "Equipment Maintenance & Repairs", color: "bg-orange-50 text-orange-700 border-orange-200", barColor: "bg-orange-500", hexColor: "#F97316" },
  { value: "OTHER", label: "Other Operational", color: "bg-slate-50 text-slate-700 border-slate-200", barColor: "bg-slate-500", hexColor: "#64748B" }
];

export function FinancePanel({ initialIncomes, initialExpenses, primaryColor }: FinancePanelProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [incomes, setIncomes] = useState<IncomeTransaction[]>(initialIncomes);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(initialExpenses);

  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all" | "custom">("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [chartViewMode, setChartViewMode] = useState<"COMBINED" | "SALES" | "CARS">("COMBINED");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: "",
    category: "SUPPLIES",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  // Combined ledger
  const safeGetTime = (dateVal: any) => {
    try {
      if (!dateVal) return 0;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  // Combined ledger
  const allTransactions: Transaction[] = [
    ...(incomes || []),
    ...(expenses || [])
  ].sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));

  // Date Range Filtering helper
  const filterByDate = (tx: Transaction) => {
    try {
      if (!tx || !tx.date) return true;
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return true;
      const now = new Date();

      if (dateRange === "today") {
        return txDate.toDateString() === now.toDateString();
      }
      if (dateRange === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return txDate >= oneWeekAgo;
      }
      if (dateRange === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(now.getDate() - 30);
        return txDate >= oneMonthAgo;
      }
      if (dateRange === "custom") {
        if (!customStartDate) return true;
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = customEndDate ? new Date(customEndDate) : new Date();
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }
      return true; // "all"
    } catch {
      return true;
    }
  };

  // Search & Tag Filters
  const filteredTransactions = allTransactions.filter((tx) => {
    // 1. Date filter
    if (!filterByDate(tx)) return false;

    // 2. Type filter
    if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;

    // 3. Category filter
    if (categoryFilter !== "ALL") {
      if (tx.type === "EXPENSE" && tx.category !== categoryFilter) return false;
      if (tx.type === "INCOME" && tx.paymentMethod !== categoryFilter) return false;
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (tx.type === "INCOME") {
        return (
          tx.invoiceNumber.toLowerCase().includes(query) ||
          tx.vehicleNumber.toLowerCase().includes(query) ||
          tx.customerName.toLowerCase().includes(query)
        );
      } else {
        return (
          tx.title.toLowerCase().includes(query) ||
          (tx.notes && tx.notes.toLowerCase().includes(query))
        );
      }
    }

    return true;
  });

  // Calculate Aggregates for CURRENT FILTERED SET
  const totalIncome = filteredTransactions
    .filter((tx): tx is IncomeTransaction => tx.type === "INCOME")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTransactions
    .filter((tx): tx is ExpenseTransaction => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  // Expenses Category breakdown calculation
  const expenseTransactions = filteredTransactions.filter(
    (tx): tx is ExpenseTransaction => tx.type === "EXPENSE"
  );
  const categoryTotals: Record<string, number> = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    categoryTotals[cat.value] = 0;
  });
  expenseTransactions.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  // Calculate daily Sales vs Car Volume (Vehicle Count) metrics
  let daysToDraw = 7;
  let chartEndAnchor = new Date();
  if (dateRange === "today") {
    daysToDraw = 7;
  } else if (dateRange === "week") {
    daysToDraw = 7;
  } else if (dateRange === "month") {
    daysToDraw = 30;
  } else if (dateRange === "custom" && customStartDate && customEndDate) {
    const s = new Date(customStartDate);
    const e = new Date(customEndDate);
    const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    daysToDraw = Math.min(diff, 45);
    chartEndAnchor = new Date(e);
  } else if (dateRange === "all") {
    daysToDraw = 30;
  }

  const todayStr = new Date().toDateString();
  const salesVolumeData: Array<{
    dateKey: string;
    label: string;
    dayName: string;
    fullDateLabel: string;
    sales: number;
    carsCount: number;
    avgTicket: number;
    isToday: boolean;
  }> = [];

  for (let i = daysToDraw - 1; i >= 0; i--) {
    const d = new Date(chartEndAnchor);
    d.setDate(d.getDate() - i);
    const dateKey = d.toDateString();
    const isToday = dateKey === todayStr;
    const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const fullDateLabel = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    // Aggregate sales and vehicle counts on this date
    const matchingIncomes = (incomes || []).filter((tx) => {
      try {
        return tx && tx.date && new Date(tx.date).toDateString() === dateKey;
      } catch {
        return false;
      }
    });

    const daySales = matchingIncomes.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const dayCarsCount = matchingIncomes.length;
    const avgTicket = dayCarsCount > 0 ? Math.round(daySales / dayCarsCount) : 0;

    salesVolumeData.push({
      dateKey,
      label,
      dayName,
      fullDateLabel,
      sales: daySales,
      carsCount: dayCarsCount,
      avgTicket,
      isToday,
    });
  }

  const totalPeriodSales = salesVolumeData.reduce((s, d) => s + d.sales, 0);
  const totalPeriodCars = salesVolumeData.reduce((s, d) => s + d.carsCount, 0);
  const overallAvgTicket = totalPeriodCars > 0 ? Math.round(totalPeriodSales / totalPeriodCars) : 0;
  const maxPeriodSales = Math.max(...salesVolumeData.map((d) => d.sales), 500);
  const maxPeriodCars = Math.max(...salesVolumeData.map((d) => d.carsCount), 3);
  const peakCarDay = salesVolumeData.reduce((max, d) => (d.carsCount > (max?.carsCount || 0) ? d : max), salesVolumeData[0]);
  const peakSalesDay = salesVolumeData.reduce((max, d) => (d.sales > (max?.sales || 0) ? d : max), salesVolumeData[0]);

  // Open Add/Edit Modal
  const openExpenseModal = (expense: ExpenseTransaction | null = null) => {
    setError("");
    setSuccess("");
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        category: expense.category,
        amount: expense.amount.toString(),
        date: new Date(expense.date).toISOString().split("T")[0],
        notes: expense.notes
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: "",
        category: "SUPPLIES",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: ""
      });
    }
    setModalOpen(true);
  };

  // Submit Expense Form (Add or Edit)
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Expense title is required.");
      return;
    }
    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    startTransition(async () => {
      try {
        const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
        const method = editingExpense ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to save expense record.");
        }

        if (editingExpense) {
          setExpenses((prev) => prev.map((exp) => (exp.id === editingExpense.id ? data.expense : exp)));
          setSuccess("Expense record updated successfully!");
          toastSuccess("Expense Updated", `"${formData.title}" updated.`);
        } else {
          setExpenses((prev) => [data.expense, ...prev]);
          setSuccess("Expense logged successfully!");
          toastSuccess("Expense Logged!", `₹${formData.amount} recorded for ${formData.title}.`);
        }

        setTimeout(() => {
          setModalOpen(false);
          setSuccess("");
        }, 500);
      } catch (err: any) {
        const msg = err.message || "An error occurred.";
        setError(msg);
        toastError("Expense Failed", msg);
      }
    });
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete expense.");
      }

      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      toastSuccess("Expense Deleted", "The expense record has been removed.");
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete expense.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Log Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        {/* Date Filter Range Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 border border-slate-200/60 w-full sm:w-auto overflow-x-auto">
          {[
            { value: "today", label: "Today" },
            { value: "week", label: "7 Days" },
            { value: "month", label: "30 Days" },
            { value: "all", label: "All Time" },
            { value: "custom", label: "Custom" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setDateRange(tab.value as any)}
              className={`text-xs px-3.5 py-1.5 font-bold rounded-lg transition whitespace-nowrap ${
                dateRange === tab.value
                  ? "bg-white text-slate-800 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => openExpenseModal()}
          className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-white font-bold transition shadow-sm hover:brightness-95 text-xs uppercase tracking-wider shrink-0 active-tap"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={16} />
          Log Expense
        </button>
      </div>

      {/* Custom Date Inputs */}
      {dateRange === "custom" && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-4 max-w-md animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-9 w-full border rounded-lg px-3 text-xs outline-none focus:border-slate-400"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-9 w-full border rounded-lg px-3 text-xs outline-none focus:border-slate-400"
            />
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={18} />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Financial Cash Flow Aggregates Strip */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cash Inflow (Income) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <ArrowUpRight size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cash Inflow</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalIncome)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Paid service invoices</p>
          </div>
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Cash Outflow (Expenses) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <ArrowDownRight size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cash Outflow</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalExpense)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Logged operational costs</p>
          </div>
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Net Cash Flow (Profit/Loss) */}
        <div className={`bg-white border rounded-2xl p-4 shadow-xs flex items-center justify-between border-l-4 ${
          netProfit >= 0 ? "border-l-emerald-500" : "border-l-rose-500"
        }`}>
          <div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Net Profit / Loss</span>
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {netProfit >= 0 ? "+" : ""}{formatCurrency(netProfit)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Inflow minus Outflow</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            <Coins size={20} />
          </div>
        </div>

        {/* Profit Margin & Expense Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Profit Margin</span>
            <p className="text-2xl font-extrabold text-blue-900 mt-1">{profitMargin}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Expense ratio: {expenseRatio}%</p>
          </div>
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <DollarSign size={20} />
          </div>
        </div>
      </section>

      {/* ── 1. PROPER PIE / DONUT CHART: EXPENSE BREAKDOWN BY CATEGORY ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart size={18} className="text-blue-600" />
              Expense Distribution (Category Pie Chart)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual category distribution of operational expenses for the selected period.
            </p>
          </div>
          <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-slate-200">
            Total Outflow: {formatCurrency(totalExpense)}
          </span>
        </div>

        {totalExpense === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No operational expenses logged for this time period.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut / Pie Chart SVG */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 relative">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                  {(() => {
                    const radius = 55;
                    const circumference = 2 * Math.PI * radius; // ~345.575
                    let accumulatedOffset = 0;

                    const activeCategories = EXPENSE_CATEGORIES.map((cat) => {
                      const amt = categoryTotals[cat.value] || 0;
                      const pct = amt / totalExpense;
                      return { ...cat, amt, pct };
                    }).filter((c) => c.amt > 0);

                    return activeCategories.map((cat) => {
                      const strokeDash = cat.pct * circumference;
                      const gap = circumference - strokeDash;
                      const offset = accumulatedOffset;
                      accumulatedOffset += strokeDash;

                      return (
                        <circle
                          key={cat.value}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={cat.hexColor}
                          strokeWidth="22"
                          strokeDasharray={`${strokeDash} ${gap}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                        >
                          <title>{`${cat.label}: ${formatCurrency(cat.amt)} (${Math.round(cat.pct * 100)}%)`}</title>
                        </circle>
                      );
                    });
                  })()}
                </svg>

                {/* Donut Hole Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Spent</span>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                    {formatCurrency(totalExpense)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {EXPENSE_CATEGORIES.filter((c) => (categoryTotals[c.value] || 0) > 0).length} Categories
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const amount = categoryTotals[cat.value] || 0;
                const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

                return (
                  <div
                    key={cat.value}
                    className={`p-3 rounded-xl border transition-all ${
                      amount > 0 ? "bg-white border-slate-200/90 shadow-2xs" : "bg-slate-50/40 border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.hexColor }}
                        />
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{cat.label}</span>
                      </div>
                      <span className="text-xs font-black text-slate-700">{pct}%</span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm font-extrabold text-slate-900">{formatCurrency(amount)}</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cat.hexColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── 2. SALES VS CAR VOLUME (CARS WASHED) CORRELATION GRAPH ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Car size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Sales & Vehicle Volume (Cars Washed vs Sales)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlates the number of cars serviced against generated sales revenue and average spend per vehicle over {daysToDraw} days.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartViewMode("COMBINED")}
                className={`px-3 py-1 rounded-lg transition ${
                  chartViewMode === "COMBINED" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Combined (Sales + Cars)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("SALES")}
                className={`px-3 py-1 rounded-lg transition ${
                  chartViewMode === "SALES" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sales (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("CARS")}
                className={`px-3 py-1 rounded-lg transition ${
                  chartViewMode === "CARS" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Cars Serviced (🚗)
              </button>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Strip for Vehicle Sales Correlation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Cars Washed */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Cars Serviced</span>
              <Car size={15} />
            </div>
            <p className="text-xl font-black text-blue-900 mt-1">{totalPeriodCars}</p>
            <p className="text-[10px] text-blue-600/80 mt-0.5">Vehicles washed in period</p>
          </div>

          {/* Total Sales Generated */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Sales</span>
              <TrendingUp size={15} />
            </div>
            <p className="text-xl font-black text-emerald-900 mt-1">{formatCurrency(totalPeriodSales)}</p>
            <p className="text-[10px] text-emerald-600/80 mt-0.5">Paid service inflow</p>
          </div>

          {/* Average Revenue Per Car */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Avg Ticket / Car</span>
              <Sparkles size={15} />
            </div>
            <p className="text-xl font-black text-amber-900 mt-1">{formatCurrency(overallAvgTicket)}</p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">Average spend per vehicle</p>
          </div>

          {/* Peak Volume Day */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-wider">Peak Traffic Day</span>
              <Calendar size={15} />
            </div>
            <p className="text-sm font-black text-slate-800 mt-1 truncate">
              {peakCarDay && peakCarDay.carsCount > 0 ? `${peakCarDay.dayName}, ${peakCarDay.label}` : "No traffic yet"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {peakCarDay && peakCarDay.carsCount > 0 ? `${peakCarDay.carsCount} cars • ${formatCurrency(peakCarDay.sales)}` : "0 cars logged"}
            </p>
          </div>
        </div>

        {/* Selected / Hovered Day Interactive Info Callout */}
        {(() => {
          const activeItem = hoveredDayIndex !== null ? salesVolumeData[hoveredDayIndex] : (salesVolumeData.find(d => d.isToday) || peakSalesDay || salesVolumeData[salesVolumeData.length - 1]);
          if (!activeItem) return null;
          return (
            <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="font-extrabold text-white text-sm">{activeItem.fullDateLabel}</span>
                {activeItem.isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Car size={14} className="text-blue-400" />
                  <span className="text-slate-400">Cars:</span>
                  <span className="font-black text-white">{activeItem.carsCount} vehicles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-slate-400">Sales:</span>
                  <span className="font-black text-emerald-400">{formatCurrency(activeItem.sales)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-slate-400">Avg / Car:</span>
                  <span className="font-black text-amber-300">{formatCurrency(activeItem.avgTicket)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SVG Dual-Axis Chart Canvas */}
        {(() => {
          const svgW = 680;
          const svgH = 260;
          const padL = 50;
          const padR = 45;
          const padT = 25;
          const padB = 35;
          const cW = svgW - padL - padR;
          const cH = svgH - padT - padB;
          const n = salesVolumeData.length;

          // X coordinate of day i
          const getColX = (i: number) => padL + (i + 0.5) * (cW / n);
          const colWidth = cW / n;
          const barWidth = Math.min(Math.max(colWidth * 0.45, 8), 36);

          // Left Y coordinate for Sales (0 to maxPeriodSales)
          const getSalesY = (val: number) => padT + cH - (val / maxPeriodSales) * cH;
          // Right Y coordinate for Cars (0 to maxPeriodCars)
          const getCarsY = (val: number) => padT + cH - (val / maxPeriodCars) * cH;

          // Line path for cars
          const carPoints = salesVolumeData.map((d, i) => ({
            x: getColX(i),
            y: getCarsY(d.carsCount),
            cars: d.carsCount,
          }));

          const carLineD = carPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          const carAreaD = `${carLineD} L ${carPoints[carPoints.length - 1]?.x || 0} ${padT + cH} L ${carPoints[0]?.x || 0} ${padT + cH} Z`;

          return (
            <div className="w-full overflow-x-auto bg-slate-50/50 rounded-2xl p-3 border border-slate-200/80">
              <div className="min-w-[560px] max-w-4xl mx-auto">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
                  <defs>
                    <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="salesBarGradHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="carsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines and Left Axis Labels (Sales ₹) */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r) => {
                    const y = padT + cH - r * cH;
                    const salesVal = Math.round(r * maxPeriodSales);
                    const carsVal = Math.round(r * maxPeriodCars);

                    return (
                      <g key={r}>
                        <line
                          x1={padL}
                          y1={y}
                          x2={svgW - padR}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray={r === 0 ? "none" : "3 3"}
                        />
                        {/* Left Y Axis label: Sales (₹) */}
                        <text
                          x={padL - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="fill-slate-400 font-bold text-[9px]"
                        >
                          {salesVal >= 1000 ? `₹${(salesVal / 1000).toFixed(1)}k` : `₹${salesVal}`}
                        </text>
                        {/* Right Y Axis label: Cars count */}
                        <text
                          x={svgW - padR + 8}
                          y={y + 3.5}
                          textAnchor="start"
                          className="fill-blue-500 font-bold text-[9px]"
                        >
                          {carsVal} {r === 1 ? "cars" : ""}
                        </text>
                      </g>
                    );
                  })}

                  {/* Cars Volume Gradient Area (if view mode includes Cars) */}
                  {chartViewMode !== "SALES" && (
                    <path d={carAreaD} fill="url(#carsAreaGrad)" />
                  )}

                  {/* Sales Revenue Bars (if view mode includes Sales) */}
                  {chartViewMode !== "CARS" &&
                    salesVolumeData.map((d, i) => {
                      const cx = getColX(i);
                      const barH = (d.sales / maxPeriodSales) * cH;
                      const barY = padT + cH - barH;
                      const isHovered = hoveredDayIndex === i;

                      return (
                        <g key={d.dateKey}>
                          {/* Bar glow when hovered */}
                          {isHovered && d.sales > 0 && (
                            <rect
                              x={cx - barWidth / 2 - 2}
                              y={barY - 2}
                              width={barWidth + 4}
                              height={barH + 2}
                              rx={5}
                              fill="#0d9488"
                              opacity={0.3}
                            />
                          )}

                          {/* Main Sales Bar */}
                          {d.sales > 0 ? (
                            <rect
                              x={cx - barWidth / 2}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              rx={4}
                              fill={isHovered ? "url(#salesBarGradHover)" : "url(#salesBarGrad)"}
                              className="transition-all duration-200 cursor-pointer"
                            />
                          ) : (
                            /* Empty day dot marker */
                            <circle cx={cx} cy={padT + cH - 2} r="2" fill="#cbd5e1" />
                          )}

                          {/* Value above bar if sales > 0 */}
                          {d.sales > 0 && (
                            <text
                              x={cx}
                              y={barY - 5}
                              textAnchor="middle"
                              className={`font-black text-[9px] ${
                                isHovered ? "fill-teal-900 font-extrabold" : "fill-teal-700"
                              }`}
                            >
                              {d.sales >= 1000 ? `₹${(d.sales / 1000).toFixed(1)}k` : `₹${d.sales}`}
                            </text>
                          )}
                        </g>
                      );
                    })}

                  {/* Cars Volume Line & Nodes (if view mode includes Cars) */}
                  {chartViewMode !== "SALES" && (
                    <g>
                      <path
                        d={carLineD}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {carPoints.map((p, i) => {
                        const isHovered = hoveredDayIndex === i;
                        return (
                          <g key={i}>
                            {/* Outer halo */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? 7 : 4.5}
                              fill="#ffffff"
                              stroke="#3b82f6"
                              strokeWidth={isHovered ? 3 : 2}
                              className="transition-all duration-150 cursor-pointer"
                            />
                            {/* Inner dot */}
                            <circle cx={p.x} cy={p.y} r={isHovered ? 3 : 2} fill="#1d4ed8" />

                            {/* Car count pill above node */}
                            {p.cars > 0 && (
                              <g transform={`translate(${p.x}, ${p.y - 12})`}>
                                <rect
                                  x="-11"
                                  y="-9"
                                  width="22"
                                  height="13"
                                  rx="6.5"
                                  fill="#1e40af"
                                  className="shadow-xs"
                                />
                                <text
                                  x="0"
                                  y="0"
                                  textAnchor="middle"
                                  alignmentBaseline="middle"
                                  className="fill-white font-extrabold text-[8px]"
                                >
                                  {p.cars}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* X-Axis Day Labels and Hover Columns */}
                  {salesVolumeData.map((d, i) => {
                    const cx = getColX(i);
                    const isHovered = hoveredDayIndex === i;

                    return (
                      <g
                        key={d.dateKey}
                        onMouseEnter={() => setHoveredDayIndex(i)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className="cursor-pointer"
                      >
                        {/* Transparent hover target strip covering the whole column */}
                        <rect
                          x={cx - colWidth / 2}
                          y={padT}
                          width={colWidth}
                          height={cH}
                          fill={isHovered ? "#38bdf8" : "transparent"}
                          opacity={isHovered ? 0.08 : 0}
                          rx={6}
                        />

                        {/* Day Name & Date Label */}
                        <text
                          x={cx}
                          y={padT + cH + 14}
                          textAnchor="middle"
                          className={`font-bold text-[9px] transition-colors ${
                            isHovered
                              ? "fill-slate-900 font-extrabold"
                              : d.isToday
                              ? "fill-teal-700 font-black"
                              : "fill-slate-500"
                          }`}
                        >
                          {d.dayName}
                        </text>
                        <text
                          x={cx}
                          y={padT + cH + 25}
                          textAnchor="middle"
                          className={`text-[8px] font-semibold ${
                            isHovered || d.isToday ? "fill-teal-700 font-bold" : "fill-slate-400"
                          }`}
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend Bar below chart */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600 pt-3 border-t border-slate-200/80 mt-2 px-2">
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3 rounded-md bg-teal-600 shadow-2xs block" />
                      <span className="text-slate-800">Sales Generated (₹)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-0.5 bg-blue-600 block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white block" />
                      </div>
                      <span className="text-blue-800">Cars Serviced (🚗 Count)</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 italic">
                    💡 Hover any day column to view detailed throughput & revenue breakdown
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Transaction Ledger Table with Search & Filters */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
        <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Cash Flow Transaction Ledger</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Chronological record of all revenue inflows and operational expense outflows.</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full border rounded-lg pl-9 pr-3 text-xs outline-none focus:border-slate-400"
              />
            </div>

            {/* Type Selector */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCategoryFilter("ALL");
              }}
              className="h-9 border rounded-lg px-2.5 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Inflow (Income)</option>
              <option value="EXPENSE">Outflow (Expenses)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 border rounded-lg px-2.5 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              {typeFilter !== "INCOME" && (
                <optgroup label="Expense Categories">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {typeFilter !== "EXPENSE" && (
                <optgroup label="Payment Methods">
                  <option value="CASH">CASH Payments</option>
                  <option value="STC_PAY">STC Pay</option>
                  <option value="CARD">CARD / Mada</option>
                  <option value="BANK">BANK Transfer</option>
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Type / Category</th>
                <th className="py-3 px-4">Source / Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  let dateStr = "—";
                  try {
                    if (tx.date) {
                      const d = new Date(tx.date);
                      if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                      }
                    }
                  } catch {}

                  if (tx.type === "INCOME") {
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{dateStr}</td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-extrabold text-slate-800">{tx.invoiceNumber}</span>
                            <span className="text-slate-400 font-normal block text-[10px] mt-0.5">
                              {tx.vehicleNumber} • {tx.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Inflow
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-600">{tx.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                          +{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 italic text-[10px]">
                          Invoice Record
                        </td>
                      </tr>
                    );
                  } else {
                    const catObj = EXPENSE_CATEGORIES.find((c) => c.value === tx.category);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{dateStr}</td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-extrabold text-slate-800">{tx.title}</span>
                            {tx.notes && (
                              <span className="text-slate-400 font-normal block text-[10px] mt-0.5 italic">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded border ${catObj?.color || ""}`}>
                            {catObj?.label || tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          Operational Expense
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                          -{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openExpenseModal(tx)}
                              className="h-7 w-7 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-600 transition active-tap"
                              title="Edit Expense"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(tx.id)}
                              className="h-7 w-7 border border-slate-200 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition active-tap"
                              title="Delete Expense"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Receipt size={18} style={{ color: primaryColor }} />
                {editingExpense ? "Edit Expense Log" : "Log Operational Expense"}
              </h4>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleExpenseSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="shrink-0" size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Category (FIRST OPTION AT TOP) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expense Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as any }))}
                  className="h-10 w-full border rounded-xl px-3 text-xs font-bold text-slate-700 bg-white border-slate-300 focus:border-slate-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expense Description / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity bill for main wash bay"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="h-10 w-full border rounded-xl px-3 text-xs outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 350"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="h-10 w-full border rounded-xl px-3 text-xs outline-none focus:border-slate-400"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-10 w-full border rounded-xl px-3 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Vendor / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Supplier reference, receipt details, or payment note..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-400 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-10 border border-slate-200 rounded-xl text-slate-600 font-bold transition hover:bg-slate-50 text-xs uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-white font-bold transition hover:brightness-95 text-xs uppercase tracking-wide disabled:opacity-50 active-tap"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isPending && <LoaderIcon />}
                  {editingExpense ? "Save Changes" : "Log Outflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LoaderIcon() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
