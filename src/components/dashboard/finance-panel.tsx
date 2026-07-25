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
  Sparkles
} from "lucide-react";

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
  category: "SUPPLIES" | "UTILITIES" | "RENT" | "SALARIES" | "MARKETING" | "REPAIRS" | "OTHER";
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
  { value: "SUPPLIES", label: "Supplies & Chemicals", color: "bg-amber-50 text-amber-700 border-amber-200", barColor: "bg-amber-500" },
  { value: "UTILITIES", label: "Utilities (Water/Power)", color: "bg-blue-50 text-blue-700 border-blue-200", barColor: "bg-blue-500" },
  { value: "RENT", label: "Rent & Lease", color: "bg-indigo-50 text-indigo-700 border-indigo-200", barColor: "bg-indigo-500" },
  { value: "SALARIES", label: "Staff Salaries", color: "bg-purple-50 text-purple-700 border-purple-200", barColor: "bg-purple-500" },
  { value: "MARKETING", label: "Marketing & Ads", color: "bg-pink-50 text-pink-700 border-pink-200", barColor: "bg-pink-500" },
  { value: "REPAIRS", label: "Equipment Repairs", color: "bg-orange-50 text-orange-700 border-orange-200", barColor: "bg-orange-500" },
  { value: "OTHER", label: "Other Operational", color: "bg-slate-50 text-slate-700 border-slate-200", barColor: "bg-slate-500" }
];

export function FinancePanel({ initialIncomes, initialExpenses, primaryColor }: FinancePanelProps) {
  const [incomes, setIncomes] = useState<IncomeTransaction[]>(initialIncomes);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(initialExpenses);

  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all" | "custom">("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

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
  const allTransactions: Transaction[] = [
    ...incomes,
    ...expenses
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Date Range Filtering helper
  const filterByDate = (tx: Transaction) => {
    const txDate = new Date(tx.date);
    const now = new Date();

    if (dateRange === "today") {
      const today = new Date();
      return txDate.toDateString() === today.toDateString();
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

  // Render SVG Daily Profit Chart (maps 7 or 30 days)
  const daysToDraw = dateRange === "month" ? 30 : 7;
  const chartData: Array<{ label: string; income: number; expense: number }> = [];

  for (let i = daysToDraw - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toDateString();
    const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

    // Aggregate values for this specific calendar day
    const dayIncome = incomes
      .filter((tx) => new Date(tx.date).toDateString() === dateKey)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const dayExpense = expenses
      .filter((tx) => new Date(tx.date).toDateString() === dateKey)
      .reduce((sum, tx) => sum + tx.amount, 0);

    chartData.push({ label, income: dayIncome, expense: dayExpense });
  }

  const maxChartVal = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  // SVG Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX - 20;
  const chartHeight = svgHeight - paddingY - 15;

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
        } else {
          setExpenses((prev) => [data.expense, ...prev]);
          setSuccess("Expense logged successfully!");
        }

        setTimeout(() => {
          setModalOpen(false);
          setSuccess("");
        }, 800);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
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
      setSuccess("Expense record deleted.");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      alert(err.message || "Could not delete expense.");
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

      {/* Category Expenses Breakdown */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart size={16} className="text-blue-600" />
              Expense Breakdown by Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of operational costs across business spending categories.
            </p>
          </div>
          <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            Total Outflow: {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = categoryTotals[cat.value] || 0;
            const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

            return (
              <div key={cat.value} className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">{pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${cat.barColor}`} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Visual Daily Profit & Cashflow Chart */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <TrendingUp size={16} style={{ color: primaryColor }} />
            Daily Cash Flow Trend (Inflow vs Outflow)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Visualizing daily cash inflows and outflows over the selected {daysToDraw}-day period.
          </p>
        </div>

        {/* Pure Responsive SVG Chart */}
        <div className="w-full overflow-x-auto pt-2">
          <div className="min-w-[500px] max-w-3xl mx-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const yPos = paddingY + chartHeight - ratio * chartHeight;
                const valueLabel = Math.round(ratio * maxChartVal);
                return (
                  <g key={ratio} className="opacity-40">
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={svgWidth - 20}
                      y2={yPos}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      className="fill-slate-400 font-semibold text-[9px]"
                    >
                      {valueLabel >= 1000 ? (valueLabel / 1000).toFixed(1) + "k" : valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Day Columns & Bars */}
              {chartData.map((day, idx) => {
                const colWidth = chartWidth / daysToDraw;
                const colX = paddingX + idx * colWidth;
                
                // Income Bar
                const incHeight = (day.income / maxChartVal) * chartHeight;
                const incY = paddingY + chartHeight - incHeight;
                
                // Expense Bar
                const expHeight = (day.expense / maxChartVal) * chartHeight;
                const expY = paddingY + chartHeight - expHeight;

                const barW = Math.max(colWidth * 0.3, 4);
                const spaceBetween = 2;

                return (
                  <g key={idx} className="group">
                    <title>{`Date: ${day.label}\nInflow: ${formatCurrency(day.income)}\nExpenses: ${formatCurrency(day.expense)}`}</title>
                    
                    {/* Hover column background */}
                    <rect
                      x={colX}
                      y={paddingY}
                      width={colWidth}
                      height={chartHeight}
                      className="fill-slate-50/0 group-hover:fill-slate-50/60 transition-colors cursor-pointer"
                    />

                    {/* Income Bar (Emerald) */}
                    {day.income > 0 && (
                      <rect
                        x={colX + colWidth / 2 - barW - spaceBetween}
                        y={incY}
                        width={barW}
                        height={incHeight}
                        rx={2}
                        className="fill-emerald-500 hover:fill-emerald-600 transition-colors"
                      />
                    )}

                    {/* Expense Bar (Rose) */}
                    {day.expense > 0 && (
                      <rect
                        x={colX + colWidth / 2 + spaceBetween}
                        y={expY}
                        width={barW}
                        height={expHeight}
                        rx={2}
                        className="fill-rose-500 hover:fill-rose-600 transition-colors"
                      />
                    )}

                    {/* X Axis Date Label */}
                    {(daysToDraw === 7 || idx % 5 === 0 || idx === daysToDraw - 1) && (
                      <text
                        x={colX + colWidth / 2}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className="fill-slate-500 font-semibold text-[9px]"
                      >
                        {day.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X Axis Line */}
              <line
                x1={paddingX}
                y1={paddingY + chartHeight}
                x2={svgWidth - 20}
                y2={paddingY + chartHeight}
                stroke="#94a3b8"
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500 block" />
            <span>Revenue Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500 block" />
            <span>Operational Expenses Outflow</span>
          </div>
        </div>
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
                  const dateStr = new Date(tx.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

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

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expense Description / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Detailing shampoo bulk refill"
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

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expense Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-10 w-full border rounded-xl px-3 text-xs font-bold text-slate-700 bg-white"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
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
