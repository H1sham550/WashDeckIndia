import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditPanel } from "@/components/dashboard/audit-panel";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await requireRole(["OWNER"]);

  // Fetch audit logs with actor relation
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      stationId: session.stationId,
    },
    include: {
      actor: true,
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  // Fetch station users to populate dropdown filter
  const stationUsers = await prisma.user.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });

  // Gather unique actions from logs for filter options
  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  const serializedLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadataJson: log.metadataJson,
    createdAt: log.createdAt.toISOString(),
    actor: log.actor
      ? {
          id: log.actor.id,
          name: log.actor.name,
          email: log.actor.email,
        }
      : null,
  }));

  const serializedUsers = stationUsers.map((u) => ({
    id: u.id,
    name: u.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Owner Audit Logs</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Trace security trails and trace detailing operations, status transitions, pricing changes, and staff events.
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
