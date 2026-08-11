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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [staff, logs, todayLog] = await Promise.all([
    prisma.user.findMany({
      where: { stationId, isDeleted: false },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendanceLog.findMany({
      where: { stationId },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.attendanceLog.findFirst({
      where: {
        stationId,
        staffId: session.id,
        date: { gte: todayStart },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const serializedLogs = logs.map((l) => ({
    id: l.id,
    staffId: l.staffId,
    staffName: l.staffName,
    date: l.date.toISOString(),
    status: l.status,
    checkIn: l.checkIn ? l.checkIn.toISOString() : null,
    checkOut: l.checkOut ? l.checkOut.toISOString() : null,
    latitude: l.latitude,
    longitude: l.longitude,
    isGeofenced: l.isGeofenced,
    notes: l.notes,
  }));

  const serializedStaff = staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    mobile: (s as any).mobile || s.email || "—",
  }));

  const serializedTodayLog = todayLog
    ? {
        id: todayLog.id,
        checkIn: todayLog.checkIn ? todayLog.checkIn.toISOString() : null,
        checkOut: todayLog.checkOut ? todayLog.checkOut.toISOString() : null,
        status: todayLog.status,
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <AttendancePanel
        initialLogs={serializedLogs}
        staffMembers={serializedStaff}
        stationId={stationId}
        currentUserId={session.id}
        currentUserName={session.name}
        userRole={session.role}
        initialTodayLog={serializedTodayLog}
      />
    </div>
  );
}
