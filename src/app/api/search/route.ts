import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    if (!q || q.length < 2) {
      return NextResponse.json({ vehicles: [], jobs: [], customers: [], expenses: [], services: [] });
    }

    const stationId = session.stationId;

    const [vehicles, jobs, customers, expenses, services] = await Promise.all([
      // 1. Vehicles
      prisma.vehicle.findMany({
        where: {
          stationId,
          isDeleted: false,
          OR: [
            { vehicleNumber: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { color: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          contacts: {
            include: { customer: true },
          },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // 2. Jobs & Job Cards
      prisma.jobCard.findMany({
        where: {
          stationId,
          isDeleted: false,
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { vehicle: { vehicleNumber: { contains: q, mode: "insensitive" } } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: {
          vehicle: true,
          customer: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // 3. Customers
      prisma.customer.findMany({
        where: {
          stationId,
          isDeleted: false,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // 4. Expenses
      prisma.expense.findMany({
        where: {
          stationId,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { date: "desc" },
      }),

      // 5. Services & Detailing Packages
      prisma.service.findMany({
        where: {
          stationId,
          isDeleted: false,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      vehicles: vehicles.map((v) => {
        const primaryCustomer = v.contacts?.[0]?.customer;
        return {
          id: v.id,
          title: `${v.brand || "Vehicle"} ${v.model || ""} (${v.vehicleNumber})`,
          subtitle: primaryCustomer
            ? `${primaryCustomer.name} • ${primaryCustomer.mobile || ""}`
            : "No owner linked",
          type: "VEHICLE",
          url: `/dashboard/vehicles/${v.id}`,
        };
      }),
      jobs: jobs.map((j) => ({
        id: j.id,
        title: `Job #${j.id.slice(0, 8).toUpperCase()} — ${j.vehicle?.vehicleNumber || "Vehicle"}`,
        subtitle: `${j.customer?.name || "Customer"} • Status: ${j.status}`,
        type: "JOB",
        url: `/dashboard/jobs/${j.id}`,
      })),
      customers: customers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.mobile,
        type: "CUSTOMER",
        url: `/dashboard/vehicles?search=${encodeURIComponent(c.mobile)}`,
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        title: `${e.category}: ${e.title || e.notes || "General Expense"}`,
        subtitle: `Amount: ₹${e.amount} • Date: ${new Date(e.date).toLocaleDateString("en-IN")}`,
        type: "EXPENSE",
        url: `/dashboard/finance`,
      })),
      services: services.map((s) => ({
        id: s.id,
        title: `Service: ${s.name}`,
        subtitle: s.description || "Car wash / detailing service",
        type: "SERVICE",
        url: `/dashboard/services`,
      })),
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
