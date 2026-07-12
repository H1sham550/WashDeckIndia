import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      wrapper: "py-8",
      iconWrapper: "h-10 w-10",
      iconSize: 18,
      title: "text-sm font-bold",
      description: "text-xs",
      button: "text-xs px-3 py-1.5",
    },
    md: {
      wrapper: "py-12",
      iconWrapper: "h-14 w-14",
      iconSize: 24,
      title: "text-base font-bold",
      description: "text-sm",
      button: "text-sm px-4 py-2",
    },
    lg: {
      wrapper: "py-16",
      iconWrapper: "h-16 w-16",
      iconSize: 28,
      title: "text-lg font-bold",
      description: "text-sm",
      button: "text-sm px-5 py-2.5",
    },
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.wrapper,
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-100",
            sizes.iconWrapper
          )}
        >
          <Icon size={sizes.iconSize} strokeWidth={1.5} />
        </div>
      )}

      <h3 className={cn("text-slate-700 tracking-tight", sizes.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn("text-slate-400 mt-1.5 max-w-xs leading-relaxed", sizes.description)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "rounded-xl font-semibold bg-wd-teal-700 text-white hover:bg-wd-teal-800 transition-colors active-tap",
                sizes.button
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                "rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active-tap",
                sizes.button
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
