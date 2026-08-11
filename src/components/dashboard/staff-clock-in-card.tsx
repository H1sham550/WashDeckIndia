"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Clock, MapPin, CheckCircle2, LogOut, AlertTriangle, ShieldCheck, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type StaffClockInCardProps = {
  currentUserId: string;
  currentUserName: string;
  userRole: string;
  stationId: string;
  initialTodayLog?: {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
  } | null;
};

export function StaffClockInCard({
  currentUserId,
  currentUserName,
  userRole,
  stationId,
  initialTodayLog = null,
}: StaffClockInCardProps) {
  const toast = useToast();
  const [todayLog, setTodayLog] = useState(initialTodayLog);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [stationGpsSet, setStationGpsSet] = useState<boolean>(true);

  const isClockedIn = todayLog && todayLog.checkIn && !todayLog.checkOut;
  const isClockedOut = todayLog && todayLog.checkIn && todayLog.checkOut;

  async function handleClockIn() {
    setLocationError("");
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      const err = "Geolocation is not supported by your browser or app.";
      setLocationError(err);
      toast.error("Location Required", err);
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);

        startTransition(async () => {
          try {
            const res = await fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                staffId: currentUserId,
                staffName: currentUserName,
                status: "PRESENT",
                checkIn: new Date().toISOString(),
                latitude,
                longitude,
              }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
              throw new Error(data.error || "Failed to mark attendance.");
            }

            setTodayLog(data);
            toast.success(
              "Attendance Marked!",
              `Clocked in successfully at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`
            );
          } catch (err: any) {
            setLocationError(err.message);
            toast.error("Clock In Failed", err.message);
          }
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errMsg = "Unable to retrieve location.";
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = "Location permission needed: Please tap 'Allow' when your device asks for location permission, or tap 'Request Permission Again' below.";
          setShowPermissionModal(true);
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "GPS signal weak or unavailable. Please ensure Location/GPS is turned ON on your phone.";
        } else if (error.code === error.TIMEOUT) {
          errMsg = "GPS request timed out. Tap Clock In again to retry.";
        }
        setLocationError(errMsg);
        toast.error("Location Required", errMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function handleClockOut() {
    if (!todayLog?.id) return;

    startTransition(async () => {
      try {
        const checkOutTime = new Date().toISOString();
        const res = await fetch(`/api/attendance/${todayLog.id}/checkout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkOut: checkOutTime }),
        });

        if (!res.ok) {
          throw new Error("Failed to check out.");
        }

        setTodayLog((prev) => (prev ? { ...prev, checkOut: checkOutTime } : null));
        toast.success(
          "Shift Ended",
          `Clocked out at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`
        );
      } catch (err: any) {
        toast.error("Clock Out Failed", err.message);
      }
    });
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-teal-800/40 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isClockedIn ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isClockedIn ? "bg-emerald-500" : "bg-amber-500"}`} />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-300">
              Staff Shift & Attendance
            </span>
            <span className="text-[10px] bg-teal-900/60 border border-teal-700/50 px-2 py-0.5 rounded-full text-teal-200 font-semibold flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-400" /> GPS Geofenced
            </span>
          </div>

          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            Hello, {currentUserName}
          </h3>

          <p className="text-xs text-slate-300 font-medium">
            {isClockedIn
              ? `Shift Active • Clocked in at ${new Date(todayLog.checkIn!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : isClockedOut
              ? `Shift Finished • Clocked out at ${new Date(todayLog.checkOut!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Mark your daily attendance at the wash station using verified GPS location."}
          </p>

          {locationError && (
            <div className="flex items-start gap-1.5 p-2.5 bg-rose-950/80 border border-rose-700/60 text-rose-200 rounded-xl text-xs mt-2 font-medium">
              <AlertTriangle size={15} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 w-full sm:w-auto">
          {!todayLog || (!isClockedIn && !isClockedOut) ? (
            <button
              onClick={handleClockIn}
              disabled={isGettingLocation || isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide px-6 py-3 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isGettingLocation || isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying GPS Location...
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  Clock In (Mark Attendance)
                </>
              )}
            </button>
          ) : isClockedIn ? (
            <button
              onClick={handleClockOut}
              disabled={isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wide px-6 py-3 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <LogOut size={16} />
                  Clock Out (End Shift)
                </>
              )}
            </button>
          ) : (
            <div className="bg-teal-900/40 border border-teal-700/40 text-teal-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Attendance Recorded Today
            </div>
          )}
        </div>
      </div>

      {/* Location Permission Help Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Navigation size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Enable Location Permissions</h3>
                <p className="text-xs text-slate-500 font-medium">GPS location is required to verify your attendance at the station</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <p className="font-bold text-slate-800">To grant location access:</p>
              <ol className="list-decimal list-inside space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>Tap <strong>"Request Permission & Clock In"</strong> below.</li>
                <li>Tap <strong>"Allow"</strong> when your device popup asks for location access.</li>
                <li>If blocked, tap the 🔒 lock icon near the website URL address bar.</li>
              </ol>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="w-1/2 py-2.5 px-4 text-xs font-bold text-slate-600 border rounded-xl hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionModal(false);
                  handleClockIn();
                }}
                className="w-1/2 py-2.5 px-4 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <MapPin size={14} /> Request & Clock In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
