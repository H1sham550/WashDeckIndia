"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, Clock, ShieldAlert, Sparkles, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/currency";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Subscription Expiring Soon",
      message: "Sparkle Shine Auto Car Wash plan expires in 5 days.",
      type: "warning",
      time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
    },
    {
      id: "notif-2",
      title: "Manual Payment Pending Verification",
      message: "Speedy Detailers uploaded UTR #889214 for Professional Plan.",
      type: "payment",
      time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      read: false,
    },
    {
      id: "notif-3",
      title: "Storage Nearing Limit",
      message: "Platform S3 / Cloudinary asset bucket at 84% capacity.",
      type: "system",
      time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors active-tap shrink-0"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-0 sm:inset-auto sm:left-0 rtl:sm:left-0 rtl:sm:right-auto sm:top-full sm:mt-2 z-[200] flex items-start justify-center sm:block pt-2 sm:pt-0 px-2 sm:px-0">
          {/* Backdrop Overlay for closing on outside click */}
          <div
            className="fixed inset-0 bg-slate-900/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none"
            onClick={() => setOpen(false)}
          />

          {/* Notification Panel Card */}
          <div className="relative z-[210] w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">الإشعارات / Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-extrabold text-teal-800 hover:text-teal-950 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[65vh] sm:max-h-80 overflow-y-auto py-2 -webkit-overflow-scrolling-touch">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`py-3 px-2 rounded-xl transition-colors ${
                    notif.read ? "opacity-75" : "bg-slate-50/90 border border-slate-100/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0 mt-0.5">
                      {notif.type === "warning" ? (
                        <AlertTriangle size={16} className="text-amber-600" />
                      ) : notif.type === "payment" ? (
                        <CheckCircle2 size={16} className="text-teal-700" />
                      ) : (
                        <ShieldAlert size={16} className="text-blue-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-slate-700 font-medium mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">{formatRelativeTime(notif.time)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
