import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all active stations
    const stations = await prisma.station.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
    });

    const results = [];

    for (const station of stations) {
      // 1. Calculate today's delivered/completed jobs
      const todayJobsCount = await prisma.jobCard.count({
        where: {
          stationId: station.id,
          createdAt: { gte: todayStart, lte: todayEnd },
          isDeleted: false,
        },
      });

      // 2. Calculate today's revenue from invoices
      const todayInvoices = await prisma.invoice.findMany({
        where: {
          stationId: station.id,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ["PAID", "ISSUED"] },
        },
        select: { finalAmount: true },
      });
      const todayRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);

      // 3. Calculate today's operational expenses
      const todayExpenses = await prisma.expense.findMany({
        where: {
          stationId: station.id,
          date: { gte: todayStart, lte: todayEnd },
        },
        select: { amount: true },
      });
      const todayExpenseTotal = todayExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

      const netProfit = todayRevenue - todayExpenseTotal;

      // 4. Create in-app EOD notification for store owner
      const notificationTitle = `🌙 Nightly EOD Summary (10:00 PM)`;
      const notificationMessage = `Today's EOD Report for ${station.name}: 🚗 ${todayJobsCount} Cars Washed | 💰 SAR ${todayRevenue.toLocaleString()} Revenue | 💸 SAR ${todayExpenseTotal.toLocaleString()} Expenses | 📈 Net Profit: SAR ${netProfit.toLocaleString()}.`;

      await prisma.notification.create({
        data: {
          stationId: station.id,
          title: notificationTitle,
          message: notificationMessage,
          priority: "HIGH",
          isRead: false,
        },
      });

      results.push({
        stationId: station.id,
        stationName: station.name,
        jobsCount: todayJobsCount,
        revenue: todayRevenue,
        expenses: todayExpenseTotal,
        netProfit,
      });
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), summaries: results });
  } catch (error: any) {
    console.error("Cron Daily Summary Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
