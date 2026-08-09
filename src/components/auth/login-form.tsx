"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, KeyRound, User, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Silent background warmup to eliminate serverless cold starts while the user is typing
  useEffect(() => {
    fetch("/api/auth/login")
      .then((res) => res.json())
      .catch((err) => console.error("Silent warmup error:", err));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push(data.redirectTo || "/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not log in.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header is now beautifully handled by the parent page to prevent duplication on mobile */}

      {error && (
        <div className="mb-4 flex items-center gap-3 p-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg">
          <AlertTriangle className="shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="identity">
            Email or Mobile Number
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 text-slate-400 pointer-events-none" size={16} />
            <input
              id="identity"
              type="text"
              required
              disabled={loading}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. owner@example.com"
              className="h-11 w-full rounded-xl border border-slate-250/80 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
            Password
          </label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 text-slate-400 pointer-events-none" size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-slate-250/80 pl-10 pr-11 text-sm font-semibold outline-none focus:border-[var(--primary-color)] transition bg-slate-50/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-white text-sm font-bold shadow-md shadow-slate-200 hover:brightness-95 active:scale-[0.99] transition duration-150"
          style={{ backgroundColor: "var(--primary-color, #0b2240)" }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-medium">
          New to WashDeck?{" "}
          <a
            href="/register"
            className="font-bold text-teal-700 hover:text-teal-800 hover:underline transition"
          >
            Register Store Account (1 Month FREE)
          </a>
        </p>
      </div>
    </div>
  );
}
