import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Package,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  ChevronLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, PlanBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, daysRemaining, getDaysRemainingLabel } from "@/lib/currency";
import { Customer360View } from "@/components/admin/customer-360-view";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  const { id } = await params;

  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      users: {
        where: { isDeleted: false },
        orderBy: { role: "asc" },
      },
      stationSubscriptions: {
        orderBy: { endDate: "desc" },
        include: {
          subscription: true,
        },
      },
      featureOverrides: true,
      jobCards: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          invoice: true,
          vehicle: { select: { vehicleNumber: true, brand: true, model: true } },
        },
      },
    },
  });

  if (!station || station.isDeleted) {
    notFound();
  }

  const owner = station.users.find((u) => u.role === "OWNER") ?? station.users[0] ?? null;
  const staffMembers = station.users.filter((u) => u.role === "STAFF");
  const activeSub = station.stationSubscriptions.find((sub) => sub.status === "ACTIVE") ?? station.stationSubscriptions[0] ?? null;
  const remDays = daysRemaining(activeSub?.endDate);
  const { label: expiryLabel, colorClass: expiryColor } = getDaysRemainingLabel(remDays);

  // Fetch audit history scoped to this station
  const auditLogs = await prisma.auditLog.findMany({
    where: { stationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { name: true, role: true } },
    },
  });

  // Calculate some basic customer metrics
  const totalJobsCount = await prisma.jobCard.count({
    where: { stationId: id, isDeleted: false },
  });

  const totalRevenueResult = await prisma.invoice.aggregate({
    where: {
      jobCard: { stationId: id },
      paymentStatus: "PAID",
    },
    _sum: { finalAmount: true },
  });
  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <Customer360View
        station={station}
        owner={owner}
        staffMembers={staffMembers}
        activeSub={activeSub}
        auditLogs={auditLogs}
        totalJobsCount={totalJobsCount}
        totalRevenue={totalRevenue}
        currency={(station as any).currency ?? "INR"}
      />
    </div>
  );
}
