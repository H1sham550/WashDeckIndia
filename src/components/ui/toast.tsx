"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => string;
  success: (title: string, message?: string, opts?: Partial<Toast>) => string;
  error: (title: string, message?: string, opts?: Partial<Toast>) => string;
  warning: (title: string, message?: string, opts?: Partial<Toast>) => string;
  info: (title: string, message?: string, opts?: Partial<Toast>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

const NOOP_TOAST: ToastContextValue = {
  toasts: [],
  toast: () => "",
  success: () => "",
  error: () => "",
  warning: () => "",
  info: () => "",
  dismiss: () => {},
  dismissAll: () => {},
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return NOOP_TOAST;
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">): string => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { ...opts, id, duration: opts.duration ?? 4000 };
      setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 toasts
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => dismiss(id), newToast.duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string, opts?: Partial<Toast>) =>
      toast({ type: "success", title, message, ...opts }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string, opts?: Partial<Toast>) =>
      toast({ type: "error", title, message, duration: 6000, ...opts }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string, opts?: Partial<Toast>) =>
      toast({ type: "warning", title, message, ...opts }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string, opts?: Partial<Toast>) =>
      toast({ type: "info", title, message, ...opts }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container ─────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-20 sm:bottom-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none items-center sm:items-end"
      style={{ maxWidth: "min(380px, calc(100vw - 2rem))" }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Toast Item ───────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />,
  error:   <XCircle    size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />,
  info:    <Info       size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />,
};

const BORDERS: Record<ToastType, string> = {
  success: "border-l-emerald-500",
  error:   "border-l-red-500",
  warning: "border-l-amber-500",
  info:    "border-l-blue-500",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 bg-white rounded-xl border border-slate-200 border-l-4 shadow-lg px-4 py-3",
        "transition-all duration-200 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        BORDERS[toast.type]
      )}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {toast.onUndo && toast.undoLabel && (
          <button
            onClick={() => { toast.onUndo?.(); onDismiss(toast.id); }}
            className="mt-1.5 text-xs font-bold text-wd-teal-700 hover:text-wd-teal-800 underline-offset-2 hover:underline"
          >
            {toast.undoLabel}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 -mt-0.5 -mr-1"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Standalone helper (for use outside React tree) ──────────────────────────

// For convenience, export a simple imperative API that works when ToastProvider is mounted
let _toast: ToastContextValue["toast"] | null = null;

export function setToastHandler(fn: ToastContextValue["toast"]) {
  _toast = fn;
}

export const imperativeToast = {
  success: (title: string, message?: string) => _toast?.({ type: "success", title, message }),
  error: (title: string, message?: string) => _toast?.({ type: "error", title, message, duration: 6000 }),
  warning: (title: string, message?: string) => _toast?.({ type: "warning", title, message }),
  info: (title: string, message?: string) => _toast?.({ type: "info", title, message }),
};
