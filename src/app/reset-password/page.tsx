"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, KeyRound, CheckCircle2 } from "lucide-react";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Reset password failed.");
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirection should go to dashboard (which redirects to onboarding if not completed)
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-slate-50/50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100/50 md:p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <WashDeckLogo className="w-32" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Reset Temporary Password</h3>
          <p className="text-xs text-slate-400 mt-1">
            For security reasons, you must change your temporary password before accessing your detailing workspace.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg">
            <AlertTriangle className="shrink-0 text-rose-500" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-3 p-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">
            <CheckCircle2 className="shrink-0 text-emerald-500" size={16} />
            <span>Password updated successfully! Redirecting...</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleReset}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
              New Password (min 8 characters)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                id="password"
                type="password"
                required
                disabled={loading || success}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-semibold outline-none focus:border-slate-800 transition bg-slate-50/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={loading || success}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-semibold outline-none focus:border-slate-800 transition bg-slate-50/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-white text-sm font-bold shadow-md hover:brightness-95 active:scale-[0.99] transition duration-150 bg-slate-800"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Updating password...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
