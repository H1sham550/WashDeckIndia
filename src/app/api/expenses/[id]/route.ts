import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireFeature } from "@/lib/feature-flags";

const updateExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").optional(),
  category: z.enum(["SUPPLIES", "UTILITIES", "RENT", "SALARIES", "MARKETING", "REPAIRS", "OTHER"]).optional(),
  amount: z.union([z.number(), z.string().transform((v) => Number(v))]).refine((val) => val > 0, {
    message: "Amount must be greater than 0",
  }).optional(),
  date: z.string().transform((v) => new Date(v)).optional(),
  notes: z.string().trim().nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireFeature("finance");
    const session = await requireRole(["OWNER"]);
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Ensure expense exists and belongs to this station
    const existing = await prisma.expense.findFirst({
      where: {
        id,
        stationId: session.stationId || "",
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Expense record not found." }, { status: 404 });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: parsed.data,
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        stationId: session.stationId,
        action: "FINANCE_EXPENSE_UPDATED",
        entityType: "Expense",
        entityId: expense.id,
        newValue: { 
          title: expense.title, 
          category: expense.category, 
          amount: Number(expense.amount),
          previousAmount: Number(existing.amount) 
        },
      },
    });

    return NextResponse.json({ ok: true, expense });
  } catch (error: any) {
    console.error("PATCH expense error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireFeature("finance");
    const session = await requireRole(["OWNER"]);
    const { id } = await context.params;

    // Ensure expense exists and belongs to this station
    const existing = await prisma.expense.findFirst({
      where: {
        id,
        stationId: session.stationId || "",
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Expense record not found." }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        stationId: session.stationId,
        action: "FINANCE_EXPENSE_DELETED",
        entityType: "Expense",
        entityId: id,
        newValue: { title: existing.title, category: existing.category, amount: Number(existing.amount) },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE expense error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
