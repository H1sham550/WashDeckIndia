import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancePanel } from "@/components/dashboard/finance-panel";
import { DailyEodSummaryCard } from "@/components/dashboard/daily-eod-summary-card";
import { getStationEntitlements } from "@/lib/entitlement";
import { getCached } from "@/lib/cache";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function FinancePage() {
  const session = await requireStationUser();

  if (session.role !== "OWNER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Owner Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Expense tracking and profit/loss financials are restricted to Store Owners. You are currently logged in as Staff ({session.name}).
        </p>
        <div>
          <Link href="/dashboard" className="btn btn-primary inline-flex">
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!session.stationId) {
    redirect("/login");
  }

  const entitlements = await getStationEntitlements(session.stationId);

  if (!entitlements.stationMetadata) {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ paidInvoices, expenses }, todayCarsCount, activeStaffCount] = await Promise.all([
    getCached(`finance_data_${session.stationId}`, 15, async () => {
      const [invoices, exps] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            stationId: session.stationId,
            status: "PAID",
            jobCard: { isDeleted: false },
          },
          include: {
            jobCard: {
              include: { vehicle: true, customer: true },
            },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.expense.findMany({
          where: { stationId: session.stationId },
          orderBy: { date: "desc" },
        }),
      ]);
      return { paidInvoices: invoices, expenses: exps };
    }).catch(() => ({ paidInvoices: [], expenses: [] })),
    prisma.jobCard.count({
      where: { stationId: session.stationId, createdAt: { gte: todayStart, lte: todayEnd }, isDeleted: false },
    }).catch(() => 0),
    prisma.user.count({
      where: { stationId: session.stationId, role: "STAFF", isDeleted: false },
    }).catch(() => 0),
  ]);

  const incomes = (paidInvoices || []).map((inv) => ({
    id: inv.id,
    jobCardId: inv.jobCardId,
    invoiceNumber: inv.invoiceNumber || `INV-${inv.id.slice(0, 6)}`,
    amount: Number(inv.finalAmount || 0),
    date: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
    paymentMethod: inv.payments?.[0]?.method || "CASH",
    vehicleNumber: inv.jobCard?.vehicle?.vehicleNumber || "N/A",
    customerName: inv.jobCard?.customer?.name || "Walk-in Customer",
    type: "INCOME" as const,
  }));

  const serializedExpenses = (expenses || []).map((exp) => ({
    id: exp.id,
    title: exp.title || "Expense",
    category: exp.category || "OTHER",
    amount: Number(exp.amount || 0),
    date: exp.date ? new Date(exp.date).toISOString() : new Date().toISOString(),
    notes: exp.notes || "",
    type: "EXPENSE" as const,
  }));

  const todayKey = new Date().toDateString();
  const todayExpensesList = (expenses || []).filter((e) => e && e.date && new Date(e.date).toDateString() === todayKey);
  const todayExpensesTotal = todayExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const todayRevenueTotal = (paidInvoices || [])
    .filter((inv) => inv && inv.createdAt && new Date(inv.createdAt).toDateString() === todayKey)
    .reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);

  const primaryColor = entitlements.stationMetadata?.primaryColor || "#0f766e";
  const currency = entitlements.stationMetadata?.currency === "USD" ? "$" : "₹";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Expense Tracker & Cash Flow</h1>
        <p className="text-sm text-slate-500">
          Log operational costs, track detailing revenues, and monitor full station cash flow & net profit/loss in real-time.
        </p>
      </div>

      <FinancePanel 
        initialIncomes={incomes} 
        initialExpenses={serializedExpenses} 
        primaryColor={primaryColor} 
      />

      {/* Daily EOD Nightly Summary Briefing & History Card */}
      <DailyEodSummaryCard
        currency={currency}
        stationName={entitlements.stationMetadata?.name || "WashDeck Station"}
        allIncomes={incomes}
        allExpenses={serializedExpenses}
        todayCarsCount={todayCarsCount}
        activeStaffCount={activeStaffCount}
      />
    </div>
  );
}
