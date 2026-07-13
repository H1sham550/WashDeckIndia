import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditPanel } from "@/components/dashboard/audit-panel";

export default async function AuditPage() {
  const session = await requireRole(["OWNER"]);

  const stationUsers = await prisma.user.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      stationId: session.stationId,
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  const serializedLogs = auditLogs.map((log) => {
    const actorUser = stationUsers.find((u) => u.id === log.actorUserId);
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadataJson: log.newValue || log.previousValue || null,
      createdAt: log.createdAt.toISOString(),
      actor: actorUser
        ? {
            id: actorUser.id,
            name: actorUser.name,
            email: actorUser.email || "",
          }
        : null,
    };
  });

  const serializedUsers = stationUsers.map((u) => ({
    id: u.id,
    name: u.name,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Operational Audit Trail</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Complete, immutable history of station actions, invoice generations, job status changes, and settings modifications.
        </p>
      </div>
      <AuditPanel
        initialLogs={serializedLogs}
        users={serializedUsers}
        distinctActions={uniqueActions}
      />
    </div>
  );
}
