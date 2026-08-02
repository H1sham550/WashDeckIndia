"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X, AlertTriangle } from "lucide-react";

export function SwipeBackProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isRootPath = currentPath === "/dashboard" || currentPath === "/dashboard/" || currentPath === "/admin" || currentPath === "/admin/";

    if (isRootPath) {
      window.history.pushState({ isRootGuard: true }, "", window.location.href);
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      const isNearEdge = startX < 40 || startX > window.innerWidth - 40;

      if (isNearEdge) {
        touchStartRef.current = {
          x: startX,
          y: startY,
          time: Date.now(),
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const isHorizontalSwipe = Math.abs(deltaX) > 70 && Math.abs(deltaY) < 60 && deltaTime < 400;

      if (isHorizontalSwipe) {
        if (
          (touchStartRef.current.x < 40 && deltaX > 70) ||
          (touchStartRef.current.x > window.innerWidth - 40 && deltaX < -70)
        ) {
          // 1. If any search/menu/notification modal is open, close it cleanly
          const activeCloseBtn = document.querySelector<HTMLButtonElement>("[data-modal-close-btn]");
          if (activeCloseBtn) {
            activeCloseBtn.click();
            touchStartRef.current = null;
            return;
          }

          // 2. Navigation Priority: Root pages (/dashboard, /admin) show logout confirmation prompt
          const path = window.location.pathname;
          const isRoot = path === "/dashboard" || path === "/dashboard/" || path === "/admin" || path === "/admin/";

          if (isRoot) {
            window.history.pushState({ isRootGuard: true }, "", window.location.href);
            setShowLogoutConfirm(true);
            touchStartRef.current = null;
            return;
          }

          // 3. Sub-tabs (like /dashboard/finance, /dashboard/services, etc.) priority: ALWAYS go back to /dashboard first
          if (path.startsWith("/dashboard/")) {
            router.push("/dashboard");
            touchStartRef.current = null;
            return;
          }
          if (path.startsWith("/admin/")) {
            router.push("/admin");
            touchStartRef.current = null;
            return;
          }

          // 4. Otherwise safely navigate back in history
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/dashboard");
          }
        }
      }
      touchStartRef.current = null;
    };

    const handlePopState = (e: PopStateEvent) => {
      const activeCloseBtn = document.querySelector<HTMLButtonElement>("[data-modal-close-btn]");
      if (activeCloseBtn) {
        activeCloseBtn.click();
        window.history.pushState({ isRootGuard: true }, "", window.location.href);
        return;
      }

      const path = window.location.pathname;
      const isRoot = path === "/dashboard" || path === "/dashboard/" || path === "/admin" || path === "/admin/";

      if (isRoot) {
        window.history.pushState({ isRootGuard: true }, "", window.location.href);
        setShowLogoutConfirm(true);
        return;
      }

      if (path.startsWith("/dashboard/")) {
        router.push("/dashboard");
        return;
      }

      if (path.startsWith("/admin/")) {
        router.push("/admin");
        return;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart, { capture: true } as any);
      window.removeEventListener("touchend", handleTouchEnd, { capture: true } as any);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return (
    <>
      {children}

      {/* Logout Confirmation Prompt */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" dir="rtl">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowLogoutConfirm(false)}
          />

          <div className="relative z-[310] w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 animate-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تسجيل الخروج / Confirm Log Out</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  هل أنت تأكد من إغلاق الجلسة وتسجيل الخروج؟
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
              Are you sure you want to log out of your WashDeck session? You will need to sign in again to access store management.
            </p>

            <div className="flex items-center justify-end gap-2" dir="ltr">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                إلغاء / Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
              >
                <LogOut size={14} />
                <span>{loggingOut ? "جاري الخروج..." : "تسجيل الخروج / Log Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
