import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancePanel } from "@/components/dashboard/finance-panel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ShieldAlert } from "lucide-react";

export default async function FinancePage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const enabled = await isFeatureEnabled(session.stationId, "finance");
  if (!enabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4 font-sans">
        <div className="h-14 w-14 bg-amber-50 text-amber-600 flex items-center justify-center rounded-full mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Feature Locked</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Financial Tracking is not enabled under your current subscription plan. Upgrade your plan in settings to unlock the Expense & Income Manager.
        </p>
      </div>
    );
  }

  const station = await prisma.station.findUnique({
    where: { id: session.stationId },
  });

  if (!station) {
    redirect("/login");
  }

  // 1. Fetch all paid invoices for the station
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      jobCard: {
        stationId: session.stationId,
        isDeleted: false,
      },
      paymentStatus: "PAID",
    },
    include: {
      jobCard: {
        include: {
          vehicle: true,
          customer: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // 2. Fetch all expenses for the station
  const expenses = await prisma.expense.findMany({
    where: {
      stationId: session.stationId,
    },
    orderBy: { date: "desc" },
  });

  // 3. Serialize data for Client Component
  const incomes = paidInvoices.map((inv) => ({
    id: inv.id,
    jobCardId: inv.jobCardId,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.finalAmount),
    date: inv.updatedAt.toISOString(), // Income date is when the payment was completed (updatedAt)
    paymentMethod: inv.paymentMethod || "CASH",
    vehicleNumber: inv.jobCard.vehicle.vehicleNumber,
    customerName: inv.jobCard.customer.name,
    type: "INCOME" as const,
  }));

  const serializedExpenses = expenses.map((exp) => ({
    id: exp.id,
    title: exp.title,
    category: exp.category,
    amount: Number(exp.amount),
    date: exp.date.toISOString(),
    notes: exp.notes || "",
    type: "EXPENSE" as const,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Expense & Income Manager</h1>
        <p className="text-sm text-slate-500">
          Track operational expenses, view detailing revenues, and analyze daily net profits.
        </p>
      </div>
      <FinancePanel 
        initialIncomes={incomes} 
        initialExpenses={serializedExpenses} 
        primaryColor={station.primaryColor || "#0f766e"} 
      />
    </div>
  );
}
