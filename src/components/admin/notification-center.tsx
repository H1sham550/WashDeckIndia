"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle2, AlertTriangle, Clock, ShieldAlert, Sparkles, X, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/currency";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  align?: "left" | "right";
}

let cachedNotificationList: { data: NotificationItem[]; fetchedAt: number } | null = null;

export function NotificationCenter({ align = "right" }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    cachedNotificationList ? cachedNotificationList.data : []
  );
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(!!cachedNotificationList);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedNotificationList && now - cachedNotificationList.fetchedAt < 30000) {
      setNotifications(cachedNotificationList.data);
      setHasFetched(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.notifications)) {
          const list = data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            priority: n.priority || "LOW",
            isRead: n.isRead,
            createdAt: n.createdAt,
          }));
          cachedNotificationList = { data: list, fetchedAt: now };
          setNotifications(list);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  // Fetch notifications on first mount (using cache if fresh)
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Re-fetch with fresh data when dropdown is opened
  useEffect(() => {
    if (open) {
      fetchNotifications(true);
    }
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
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
    }
  };

  const markOneRead = async (id: string) => {
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
  };

  function getNotifIcon(priority: string) {
    switch (priority) {
      case "CRITICAL":
        return <AlertTriangle size={16} className="text-red-600" />;
      case "HIGH":
        return <ShieldAlert size={16} className="text-amber-600" />;
      case "MEDIUM":
        return <CheckCircle2 size={16} className="text-teal-700" />;
      default:
        return <Sparkles size={16} className="text-blue-700" />;
    }
  }

  useEffect(() => {
    if (!open) return;
    const handlePopState = () => {
      setOpen(false);
    };
    try {
      window.history.pushState({ notifOpen: true }, "");
    } catch {}
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open]);

  const alignClass = align === "left" ? "sm:left-0 sm:right-auto" : "sm:right-0 sm:left-auto";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-white/80 hover:text-white rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all active:scale-95 shrink-0"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <div className={`fixed sm:absolute inset-0 sm:inset-auto ${alignClass} sm:top-full sm:mt-2 z-[200] flex items-start justify-center sm:block pt-2 sm:pt-0 px-2 sm:px-0`}>
          {/* Backdrop Overlay for closing on outside click */}
          <div
            className="fixed inset-0 bg-slate-900/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none"
            onClick={() => setOpen(false)}
          />

          {/* Notification Panel Card - Pinned Header & Bottom Close Bar (Sized to match Search Modal length) */}
          <div className="relative z-[210] w-full sm:w-96 max-h-[60vh] sm:max-h-[55vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header (Always Visible at Top) */}
            <div className="flex items-center justify-between p-3 sm:p-3.5 border-b border-slate-100 bg-white flex-shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-extrabold text-blue-700 hover:text-blue-950 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  data-modal-close-btn="notification-center"
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
                  title="Close notifications"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Notification List Body (Contained within 38vh) */}
            <div className="flex-1 max-h-[38vh] sm:max-h-[35vh] overflow-y-auto divide-y divide-slate-100 p-2.5 -webkit-overflow-scrolling-touch">
              {loading && !hasFetched ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-semibold text-xs flex flex-col items-center justify-center gap-2">
                  <Bell size={24} className="text-slate-300" />
                  No notifications at this time.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`py-3 px-2 rounded-xl transition-colors cursor-pointer ${
                      notif.isRead ? "opacity-75" : "bg-slate-50/90 border border-slate-100/80"
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markOneRead(notif.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0 mt-0.5">
                        {getNotifIcon(notif.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</p>
                        <p className="text-[11px] text-slate-700 font-medium mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Bottom Bar with Single-Handed Bottom-Right Close Button */}
            <div className="sm:hidden flex-shrink-0 p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end" dir="ltr">
              <button
                data-modal-close-btn="notification-center"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
              >
                <X size={14} />
                <span>إغلاق / Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
