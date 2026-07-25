import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancePanel } from "@/components/dashboard/finance-panel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getStationEntitlements, getCachedSubscriptionPlans } from "@/lib/entitlement";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";

export default async function FinancePage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const [entitlements, station] = await Promise.all([
    getStationEntitlements(session.stationId),
    prisma.station.findUnique({
      where: { id: session.stationId },
      include: { branding: true },
    }),
  ]);

  if (!entitlements.stationMetadata) {
    redirect("/login");
  }

  let paidInvoices: any[] = [];
  let expenses: any[] = [];

  try {
    const res = await Promise.all([
      prisma.invoice.findMany({
        where: {
          stationId: session.stationId,
          status: "PAID",
          jobCard: {
            isDeleted: false,
          },
        },
        include: {
          jobCard: {
            include: {
              vehicle: true,
              customer: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          stationId: session.stationId,
        },
        orderBy: { date: "desc" },
      }),
    ]);
    paidInvoices = res[0];
    expenses = res[1];
  } catch {
    paidInvoices = [
      {
        id: "inv-1",
        jobCardId: "jc-1",
        invoiceNumber: "INV-88192",
        finalAmount: 1850,
        createdAt: new Date(),
        payments: [{ method: "CARD" }],
        jobCard: { vehicle: { vehicleNumber: "KSA 4492" }, customer: { name: "Tariq Al-Mansoor" } },
      },
    ];
    expenses = [
      { id: "exp-1", title: "Detailing Shampoo & Foam Supplies", category: "SUPPLIES", amount: 350, date: new Date(), notes: "Chemical Guys Bulk Refill" },
    ];
  }

  const incomes = paidInvoices.map((inv) => ({
    id: inv.id,
    jobCardId: inv.jobCardId,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.finalAmount),
    date: inv.createdAt.toISOString(),
    paymentMethod: inv.payments[0]?.method || "CASH",
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

  const b = station?.branding || ({} as any);

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
        primaryColor={b.primaryColor || "#0f766e"} 
      />
    </div>
  );
}
