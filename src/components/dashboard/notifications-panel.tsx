"use client";

import React, { useState } from "react";
import {
  Bell,
  Check,
  CheckSquare,
  Gift,
  AlertTriangle,
  Users,
  Calendar,
  Hourglass,
  Info,
  Loader2,
} from "lucide-react";

type SystemNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsPanelProps = {
  initialNotifications: SystemNotification[];
};

export function NotificationsPanel({ initialNotifications }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setLoading(false);
    }
  }

  function getNotificationIcon(type: string) {
    if (type.startsWith("REWARD_ELIGIBLE")) {
      return <Gift className="text-emerald-500" size={18} />;
    }
    if (type.startsWith("REWARD_NEAR")) {
      return <Gift className="text-amber-500" size={18} />;
    }
    if (type === "PAYMENT_PENDING") {
      return <AlertTriangle className="text-rose-500" size={18} />;
    }
    if (type === "STAFF_LIMIT") {
      return <Users className="text-orange-500" size={18} />;
    }
    if (type === "VEHICLES_DUE_VISIT") {
      return <Calendar className="text-blue-500" size={18} />;
    }
    if (type === "SUBSCRIPTION_EXPIRY") {
      return <Hourglass className="text-rose-600" size={18} />;
    }
    return <Info className="text-slate-400" size={18} />;
  }

  function getNotificationBg(type: string) {
    if (type.startsWith("REWARD_ELIGIBLE")) return "bg-emerald-50";
    if (type.startsWith("REWARD_NEAR")) return "bg-amber-50";
    if (type === "PAYMENT_PENDING") return "bg-rose-50";
    if (type === "STAFF_LIMIT") return "bg-orange-50";
    if (type === "VEHICLES_DUE_VISIT") return "bg-blue-50";
    if (type === "SUBSCRIPTION_EXPIRY") return "bg-red-50";
    return "bg-slate-50";
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="text-[var(--primary-color)]" size={18} />
          <span className="text-xs font-bold text-slate-700">
            You have <span className="font-extrabold text-[var(--primary-color)]">{unreadCount}</span> unread alerts
          </span>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || loading}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border text-slate-600 px-3 hover:bg-slate-50 disabled:opacity-50 transition text-xs font-bold"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <>
              <CheckSquare size={14} />
              Mark All Read
            </>
          )}
        </button>
      </div>

      {/* Notifications list */}
      <div className="bg-white border rounded-xl shadow-sm divide-y">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex gap-4 items-start transition-colors ${
                !n.isRead ? "bg-slate-50/50" : ""
              }`}
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${getNotificationBg(n.type)}`}>
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className={`text-xs uppercase tracking-wide text-slate-800 ${!n.isRead ? "font-extrabold" : "font-bold"}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Mark as read inline button */}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--primary-color)] hover:underline"
                  >
                    <Check size={12} />
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs flex flex-col items-center justify-center gap-2">
            <Bell size={24} className="text-slate-300" />
            No notifications logged at this station.
          </div>
        )}
      </div>
    </div>
  );
}
