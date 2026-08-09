import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireFeature } from "@/lib/feature-flags";
import { invalidateCache } from "@/lib/cache";

const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(["ELECTRICITY", "WATER", "SUPPLIES", "UTILITIES", "RENT", "SALARIES", "MARKETING", "REPAIRS", "OTHER"]),
  amount: z.union([z.number(), z.string().transform((v) => Number(v))]).refine((val) => val > 0, {
    message: "Amount must be greater than 0",
  }),
  date: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
  notes: z.string().trim().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireFeature("finance");
    const session = await requireRole(["OWNER"]);
    const expenses = await prisma.expense.findMany({
      where: {
        stationId: session.stationId || "",
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ ok: true, expenses });
  } catch (error: any) {
    console.error("GET expenses error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireFeature("finance");
    const session = await requireRole(["OWNER"]);
    const body = await request.json();

    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, category, amount, date, notes } = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        stationId: session.stationId || "",
        title,
        category,
        amount,
        date,
        notes: notes || null,
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        stationId: session.stationId,
        action: "FINANCE_EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        newValue: { title: expense.title, category: expense.category, amount: Number(expense.amount) },
      },
    });

    // Invalidate finance data cache for instant UI sync
    if (session.stationId) {
      invalidateCache(`finance_data_${session.stationId}`);
    }

    return NextResponse.json({ ok: true, expense });
  } catch (error: any) {
    console.error("POST expense error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
