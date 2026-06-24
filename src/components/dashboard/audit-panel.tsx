"use client";

import React, { useState } from "react";
import { Search, Calendar, User, Activity, FileText } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadataJson: any;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type SimpleUser = {
  id: string;
  name: string;
};

type AuditPanelProps = {
  initialLogs: AuditLog[];
  users: SimpleUser[];
  distinctActions: string[];
};

export function AuditPanel({ initialLogs, users, distinctActions }: AuditPanelProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredLogs = logs.filter((log) => {
    // Filter by user
    if (selectedUser && log.actor?.id !== selectedUser) {
      return false;
    }
    // Filter by action
    if (selectedAction && log.action !== selectedAction) {
      return false;
    }
    // Filter by date
    if (selectedDate) {
      const logDateStr = new Date(log.createdAt).toISOString().split("T")[0];
      if (logDateStr !== selectedDate) {
        return false;
      }
    }
    return true;
  });

  function formatMetadata(metadata: any) {
    if (!metadata) return "—";
    try {
      const parts = Object.entries(metadata).map(([key, val]) => `${key}: ${val}`);
      return parts.join(", ");
    } catch {
      return "—";
    }
  }

  function getBadgeColor(action: string) {
    const uppercase = action.toUpperCase();
    if (uppercase.includes("CREATE") || uppercase.includes("CREATED")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (uppercase.includes("DELETE") || uppercase.includes("DELETED") || uppercase.includes("DISABLE") || uppercase.includes("DISABLED")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (uppercase.includes("UPDATE") || uppercase.includes("UPDATED") || uppercase.includes("CHANGE")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (uppercase.includes("PAY") || uppercase.includes("PAID") || uppercase.includes("REDEEM")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-white p-4 border rounded-xl shadow-sm text-xs font-semibold text-slate-600">
        {/* Date Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Calendar size={12} /> Filter by Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 w-full border rounded-lg px-3 outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
          />
        </div>

        {/* User Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <User size={12} /> Filter by Operator
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="h-10 w-full border rounded-lg px-3 outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Activity size={12} /> Filter by Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="h-10 w-full border rounded-lg px-3 outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
          >
            <option value="">All Actions</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-400">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {log.actor ? log.actor.name : <span className="text-slate-400 italic">System</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 italic max-w-sm truncate" title={formatMetadata(log.metadataJson)}>
                      {formatMetadata(log.metadataJson)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No matching audit logs found. Adjust filters and try again!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
