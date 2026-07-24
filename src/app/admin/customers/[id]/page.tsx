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
  const rawAuditLogs = await prisma.auditLog.findMany({
    where: { stationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const actorIds = Array.from(
    new Set(rawAuditLogs.map((l) => l.actorUserId).filter(Boolean) as string[])
  );
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, role: true },
        })
      : [];

  const auditLogs = rawAuditLogs.map((l) => ({
    ...l,
    actor: actors.find((a) => a.id === l.actorUserId) || null,
  }));

  const [totalJobsCount, totalRevenueResult, allPlans] = await Promise.all([
    prisma.jobCard.count({
      where: { stationId: id, isDeleted: false },
    }),
    prisma.invoice.aggregate({
      where: {
        stationId: id,
        status: "PAID",
      },
      _sum: { finalAmount: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "desc" },
    }),
  ]);

  const totalRevenue = Number(totalRevenueResult._sum.finalAmount ?? 0);
  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <Customer360View
        station={station}
        owner={owner}
        staffMembers={staffMembers}
        activeSub={activeSub}
        allPlans={allPlans}
        auditLogs={auditLogs}
        totalJobsCount={totalJobsCount}
        totalRevenue={totalRevenue}
        currency={(station as any).currency ?? "SAR"}
      />
    </div>
  );
}
