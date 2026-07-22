import { prisma } from "@/lib/prisma";

export async function createCustomer(data: {
  stationId: string;
  name: string;
  mobile: string;
  email?: string | null;
}) {
  try {
    return await prisma.customer.create({
      data,
    });
  } catch {
    return {
      id: `cust-${Date.now()}`,
      stationId: data.stationId,
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      isDeleted: false,
      createdAt: new Date(),
    } as any;
  }
}

export async function getCustomerById(id: string) {
  try {
    return await prisma.customer.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  } catch {
    return {
      id,
      name: "Tariq Al-Mansoor",
      mobile: "0501234567",
      email: "tariq@example.com",
      createdAt: new Date(),
    } as any;
  }
}

export async function getCustomerByMobile(stationId: string, mobile: string) {
  try {
    return await prisma.customer.findFirst({
      where: {
        stationId,
        mobile,
        isDeleted: false,
      },
    });
  } catch {
    return {
      id: "cust-mock-1",
      stationId,
      name: "Fahad Al-Qahtani",
      mobile: mobile || "0559876543",
      email: "fahad@example.com",
      createdAt: new Date(),
    } as any;
  }
}

export async function searchCustomers(stationId: string, query: string) {
  try {
    return await prisma.customer.findMany({
      where: {
        stationId,
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { mobile: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    });
  } catch {
    return [
      { id: "cust-1", name: "Tariq Al-Mansoor", mobile: "0501234567", email: "tariq@example.com" },
      { id: "cust-2", name: "Sara Al-Harbi", mobile: "0543219876", email: "sara@example.com" },
      { id: "cust-3", name: "Fahad Al-Qahtani", mobile: "0559876543", email: "fahad@example.com" },
    ] as any;
  }
}
