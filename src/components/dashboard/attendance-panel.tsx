"use client";

import React, { useState, useTransition } from "react";
import { formatTime } from "@/lib/currency";
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  UserX, 
  Plus, 
  Filter, 
  Search 
} from "lucide-react";

import { StaffClockInCard } from "./staff-clock-in-card";

type AttendanceLogItem = {
  id: string;
  staffId: string;
  staffName: string;
  date: string | Date;
  status: string; // "PRESENT", "ABSENT", "HALF_DAY", "LEAVE"
  checkIn: string | null;
  checkOut: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isGeofenced?: boolean;
  notes: string | null;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
  mobile: string;
};

interface AttendancePanelProps {
  initialLogs: AttendanceLogItem[];
  staffMembers: StaffMember[];
  stationId: string;
  currentUserId?: string;
  currentUserName?: string;
  userRole?: string;
  initialTodayLog?: {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
  } | null;
}

export function AttendancePanel({
  initialLogs,
  staffMembers,
  stationId,
  currentUserId = "",
  currentUserName = "Staff User",
  userRole = "STAFF",
  initialTodayLog = null,
}: AttendancePanelProps) {
  const [logs, setLogs] = useState<AttendanceLogItem[]>(initialLogs);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Filter logs by selected date and search
  const filteredLogs = logs.filter((log) => {
    const logDateStr = new Date(log.date).toISOString().split("T")[0];
    const matchesDate = logDateStr === selectedDate;
    const matchesQuery = log.staffName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesQuery;
  });

  // Find staff members without a log for selectedDate
  const loggedStaffIds = new Set(
    logs
      .filter((l) => new Date(l.date).toISOString().split("T")[0] === selectedDate)
      .map((l) => l.staffId)
  );

  const handleLogAttendance = async (staff: StaffMember, status: string) => {
    const checkInTime = status === "PRESENT" || status === "HALF_DAY" ? new Date().toISOString() : null;

    startTransition(async () => {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId,
            staffId: staff.id,
            staffName: staff.name,
            date: new Date(selectedDate).toISOString(),
            status,
            checkIn: checkInTime,
          }),
        });
        if (res.ok) {
          const newLog = await res.json();
          setLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
        }
      } catch (err) {
        console.error("Failed to log attendance", err);
      }
    });
  };

  const handleCheckOut = async (logId: string) => {
    const checkOutTime = new Date().toISOString();
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, checkOut: checkOutTime } : l))
    );
    try {
      await fetch(`/api/attendance/${logId}/checkout`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkOut: checkOutTime }),
      });
    } catch (err) {
      console.error("Failed to checkout attendance", err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "HALF_DAY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LEAVE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ABSENT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {currentUserId && (
        <StaffClockInCard
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          userRole={userRole}
          stationId={stationId}
          initialTodayLog={initialTodayLog}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="text-emerald-600" size={22} />
            Staff Attendance & Shift Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor daily staff check-ins, shift check-outs, attendance status, and payroll attendance records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Quick Mark Attendance for unlogged staff */}
      {staffMembers.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Mark Daily Attendance for {new Date(selectedDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffMembers.map((staff) => {
              const isLogged = loggedStaffIds.has(staff.id);
              const existingLog = logs.find(
                (l) => l.staffId === staff.id && new Date(l.date).toISOString().split("T")[0] === selectedDate
              );

              return (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs text-slate-800 truncate">{staff.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{staff.role}</p>
                  </div>

                  {isLogged && existingLog ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getStatusStyle(existingLog.status)}`}>
                        {existingLog.status}
                      </span>
                      {existingLog.status === "PRESENT" && !existingLog.checkOut && (
                        <button
                          onClick={() => handleCheckOut(existingLog.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px]"
                        >
                          Check-out
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLogAttendance(staff, "PRESENT")}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleLogAttendance(staff, "HALF_DAY")}
                        className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors"
                      >
                        Half
                      </button>
                      <button
                        onClick={() => handleLogAttendance(staff, "ABSENT")}
                        className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] transition-colors"
                      >
                        Absent
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Shift Log History
          </h3>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter staff by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No attendance shift logs recorded for <span className="font-bold text-slate-600">{selectedDate}</span>.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden md:grid grid-cols-[180px_130px_150px_150px_1fr] gap-4 px-6 py-2.5 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Staff Name</span>
              <span>Status</span>
              <span>Check-in Time</span>
              <span>Check-out Time</span>
              <span>Notes</span>
            </div>

            {filteredLogs.map((log) => {
              const checkInStr = log.checkIn
                ? new Date(log.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                : "—";
              const checkOutStr = log.checkOut
                ? new Date(log.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                : "—";

              return (
                <div
                  key={log.id}
                  className="grid grid-cols-1 md:grid-cols-[180px_130px_150px_150px_1fr] gap-3 md:gap-4 px-5 py-3.5 md:px-6 items-center hover:bg-slate-50/50 text-xs font-semibold"
                >
                  <div className="font-bold text-slate-800">{log.staffName}</div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wide ${getStatusStyle(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span>In: {checkInStr}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span>Out: {checkOutStr}</span>
                  </div>
                  <div className="text-slate-400 font-normal italic truncate">
                    {log.notes || "No additional shift notes."}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
