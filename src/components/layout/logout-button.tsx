"use client";

import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  collapsed?: boolean;
  className?: string;
};

export function LogoutButton({ collapsed, className }: LogoutButtonProps) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      title={collapsed ? "Sign out" : undefined}
      className={
        className ||
        `flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100/80 hover:bg-red-50 hover:text-red-600 border border-slate-200/60 px-3 text-xs font-bold text-slate-600 transition duration-150 active-tap`
      }
    >
      <LogOut size={14} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">Sign out</span>}
    </button>
  );
}
