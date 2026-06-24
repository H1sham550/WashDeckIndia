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
      className="flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
