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
        className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors active-tap"
        title="Admin Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Platform Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-wd-teal-50 text-wd-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-wd-teal-200">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-wd-teal-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto py-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`py-3 px-2 rounded-xl transition-colors ${
                    notif.read ? "opacity-70" : "bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs flex-shrink-0 mt-0.5">
                      {notif.type === "warning" ? (
                        <AlertTriangle size={15} className="text-amber-500" />
                      ) : notif.type === "payment" ? (
                        <CheckCircle2 size={15} className="text-wd-teal-600" />
                      ) : (
                        <ShieldAlert size={15} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(notif.time)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
