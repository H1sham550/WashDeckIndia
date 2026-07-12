"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  icon?: LucideIcon;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon: CustomIcon,
  loading = false,
}: ConfirmationDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button on open; close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const timeout = setTimeout(() => confirmRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timeout);
    };
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const Icon = CustomIcon ?? (variant === "danger" ? Trash2 : AlertTriangle);

  const iconStyles = {
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    default: "bg-slate-50 text-slate-600",
  }[variant];

  const confirmStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white",
    default: "bg-wd-teal-700 hover:bg-wd-teal-800 focus:ring-wd-teal-500 text-white",
  }[variant];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", iconStyles)}>
          <Icon size={22} strokeWidth={1.8} />
        </div>

        {/* Content */}
        <h2
          id="confirm-dialog-title"
          className="text-base font-bold text-slate-800 leading-tight"
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={async () => { await onConfirm(); }}
            disabled={loading}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 active-tap",
              confirmStyles
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
