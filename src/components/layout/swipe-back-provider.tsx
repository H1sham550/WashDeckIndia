"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SwipeBackProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      // Allow swipe back from either left edge (< 40px) or right edge (> window.innerWidth - 40px) for RTL support
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
        // Left edge swipe right (LTR edge back) or Right edge swipe left (RTL edge back)
        if (
          (touchStartRef.current.x < 40 && deltaX > 70) ||
          (touchStartRef.current.x > window.innerWidth - 40 && deltaX < -70)
        ) {
          if (window.history.length > 1) {
            router.back();
          }
        }
      }
      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart, { capture: true } as any);
      window.removeEventListener("touchend", handleTouchEnd, { capture: true } as any);
    };
  }, [router]);

  return <>{children}</>;
}
