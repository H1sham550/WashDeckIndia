import React from "react";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendancePanel } from "@/components/dashboard/attendance-panel";

export const metadata = {
  title: "Staff Attendance Logs | WashDeck",
};

export default async function AttendancePage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  // Fetch staff members belonging to station
  const staff = await prisma.user.findMany({
    where: { stationId, isDeleted: false },
    select: { id: true, name: true, role: true, mobile: true },
    orderBy: { name: "asc" },
  });

  // Fetch recent attendance logs
  const logs = await prisma.attendanceLog.findMany({
    where: { stationId },
    orderBy: { date: "desc" },
    take: 100,
  });

  const serializedLogs = logs.map((l) => ({
    id: l.id,
    staffId: l.staffId,
    staffName: l.staffName,
    date: l.date.toISOString(),
    status: l.status,
    checkIn: l.checkIn ? l.checkIn.toISOString() : null,
    checkOut: l.checkOut ? l.checkOut.toISOString() : null,
    notes: l.notes,
  }));

  const serializedStaff = staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    mobile: s.mobile || "—",
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <AttendancePanel
        initialLogs={serializedLogs}
        staffMembers={serializedStaff}
        stationId={stationId}
      />
    </div>
  );
}
