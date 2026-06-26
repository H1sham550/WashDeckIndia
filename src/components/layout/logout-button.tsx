"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 px-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition duration-150 active-tap"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
