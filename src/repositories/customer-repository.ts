import { prisma } from "@/lib/prisma";

export async function createCustomer(data: {
  stationId: string;
  name: string;
  mobile: string;
  email?: string | null;
}) {
  return prisma.customer.create({
    data,
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });
}

export async function getCustomerByMobile(stationId: string, mobile: string) {
  return prisma.customer.findFirst({
    where: {
      stationId,
      mobile,
      isDeleted: false,
    },
  });
}

export async function searchCustomers(stationId: string, query: string) {
  return prisma.customer.findMany({
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
}
