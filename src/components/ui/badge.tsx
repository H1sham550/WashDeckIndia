import React from "react";
import { cn } from "@/lib/utils";

// ─── Status Badge ─────────────────────────────────────────────────────────────

type StatusVariant =
  | "ACTIVE"
  | "TRIAL"
  | "GRACE"
  | "EXPIRED"
  | "SUSPENDED"
  | "PENDING"
  | "PAID"
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "default";

const STATUS_STYLES: Record<StatusVariant, string> = {
  ACTIVE:    "bg-stone-100 text-stone-800 border-stone-200",
  TRIAL:     "bg-blue-50 text-blue-700 border-blue-200",
  GRACE:     "bg-amber-50/60 text-amber-800 border-amber-200/60",
  EXPIRED:   "bg-slate-100 text-slate-500 border-slate-200",
  SUSPENDED: "bg-rose-50/60 text-rose-800 border-rose-200/60",
  PENDING:   "bg-amber-50/60 text-amber-800 border-amber-200/60",
  PAID:      "bg-stone-100 text-stone-800 border-stone-200",
  DRAFT:     "bg-slate-100 text-slate-500 border-slate-200",
  SENT:      "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED:  "bg-stone-100 text-stone-800 border-stone-200",
  REJECTED:  "bg-rose-50/60 text-rose-800 border-rose-200/60",
  default:   "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_DOTS: Record<StatusVariant, string> = {
  ACTIVE:    "bg-slate-800",
  TRIAL:     "bg-blue-600",
  GRACE:     "bg-amber-600",
  EXPIRED:   "bg-slate-400",
  SUSPENDED: "bg-rose-600",
  PENDING:   "bg-amber-600",
  PAID:      "bg-slate-800",
  DRAFT:     "bg-slate-400",
  SENT:      "bg-blue-600",
  APPROVED:  "bg-slate-800",
  REJECTED:  "bg-rose-600",
  default:   "bg-slate-400",
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, showDot = true, size = "sm", className }: StatusBadgeProps) {
  const variant = (STATUS_STYLES[status as StatusVariant] ? status : "default") as StatusVariant;

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5 font-bold tracking-wide",
    sm: "text-[11px] px-2 py-0.5 font-bold tracking-wide",
    md: "text-xs px-2.5 py-1 font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border uppercase",
        STATUS_STYLES[variant],
        sizes,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOTS[variant])} />
      )}
      {status}
    </span>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

type PlanTier = "Trial" | "Starter" | "Growth" | "Professional" | "Enterprise" | string;

const PLAN_STYLES: Record<string, string> = {
  Trial:        "bg-slate-100 text-slate-600 border-slate-200",
  Starter:      "bg-blue-50 text-blue-700 border-blue-200",
  Growth:       "bg-violet-50 text-violet-700 border-violet-200",
  Professional: "bg-wd-teal-50 text-wd-teal-800 border-wd-teal-200",
  Enterprise:   "bg-slate-900 text-white border-slate-800",
};

interface PlanBadgeProps {
  plan: PlanTier;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PlanBadge({ plan, size = "sm", className }: PlanBadgeProps) {
  const style = PLAN_STYLES[plan] ?? "bg-slate-100 text-slate-600 border-slate-200";

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5 font-bold",
    sm: "text-[11px] px-2 py-0.5 font-bold",
    md: "text-xs px-2.5 py-1 font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border uppercase tracking-wide",
        style,
        sizes,
        className
      )}
    >
      {plan}
    </span>
  );
}

// ─── Generic Badge ────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "teal" | "blue" | "amber" | "red" | "green" | "slate";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  teal:    "bg-stone-100 text-stone-800",
  blue:    "bg-blue-50 text-blue-700",
  amber:   "bg-amber-50/60 text-amber-800",
  red:     "bg-rose-50/60 text-rose-800",
  green:   "bg-stone-100 text-stone-800",
  slate:   "bg-slate-100 text-slate-600",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

