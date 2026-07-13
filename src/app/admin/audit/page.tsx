import { ScrollText, Search, Filter } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatRelativeTime } from "@/lib/currency";

export default async function AuditPage() {
  await requireRole(["SUPER_ADMIN"]);

  const rawLogs = await prisma.auditLog.findMany({
    take: 150,
    orderBy: { createdAt: "desc" },
    include: {
      station: { select: { name: true, slug: true } },
    },
  });

  const actorIds = Array.from(
    new Set(rawLogs.map((l) => l.actorUserId).filter(Boolean) as string[])
  );
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, role: true },
        })
      : [];

  const logs = rawLogs.map((l) => ({
    ...l,
    actor: actors.find((a) => a.id === l.actorUserId) || null,
  }));

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Platform Security & Audit Logs ({logs.length})
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Chronological log of administrative actions, tenancy updates, and security events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">No audit log records recorded across the platform yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Tenant Station</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <div>{formatDateTime(log.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">{formatRelativeTime(log.createdAt)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{log.actor?.name ?? "System / Auto"}</p>
                      <p className="text-[10px] text-slate-400">{log.actor?.role ?? "SYSTEM"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-wd-teal-800 bg-wd-teal-50 border border-wd-teal-100 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">
                      {log.entityType} <span className="text-slate-400">{log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</span>
                    </td>
                    <td className="py-3 px-4">
                      {log.station ? (
                        <div>
                          <p className="font-bold text-slate-800">{log.station.name}</p>
                          <p className="text-[10px] text-slate-400">@{log.station.slug}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Platform-Wide</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
