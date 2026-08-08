"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NativeBridge() {
  const pathname = usePathname();

  useEffect(() => {
    // Notify native React Native WebView that the Next.js page component is mounted and rendered
    if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
      // Small timeout to allow the browser paint frame to complete
      const timer = setTimeout(() => {
        try {
          (window as any).ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "PAGE_READY",
              pathname,
            })
          );
        } catch (e) {}
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
