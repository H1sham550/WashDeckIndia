import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/session";
import { LayoutDashboard, Clock, CreditCard, Users } from "lucide-react";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex" style={{ background: "#F8F9FA" }}>
      {/* Left Panel — Branding (desktop only) */}
      <div
        className="hidden lg:flex lg:w-[480px] flex-col justify-between p-10 flex-shrink-0"
        style={{ background: "#0F172A" }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "hsl(220 91% 54%)" }}
            >
              W
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              WashDeck
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-3 leading-snug">
            The operations platform<br />for detailing businesses.
          </h2>
          <p className="text-sm" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
            Manage your queue, customers, invoices, and staff — all from one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            { icon: LayoutDashboard, title: "Operations Dashboard", desc: "See your entire day at a glance" },
            { icon: Clock, title: "Live Queue Management", desc: "Track vehicles from intake to delivery" },
            { icon: CreditCard, title: "Invoicing & Payments", desc: "UPI, cash, and digital receipts" },
            { icon: Users, title: "Staff & Attendance", desc: "Manage your team in real time" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div
                className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Icon size={15} strokeWidth={1.75} style={{ color: "#94A3B8" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#E2E8F0" }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "#334155" }}>
          © {new Date().getFullYear()} WashDeck. Professional Edition.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="h-7 w-7 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "hsl(220 91% 54%)" }}
            >
              W
            </div>
            <span className="font-semibold text-base" style={{ color: "#0F172A" }}>
              WashDeck
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-semibold" style={{ color: "#0F172A" }}>
              Sign in
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          <p className="mt-6 text-xs text-center" style={{ color: "#94A3B8" }}>
            Having trouble? Contact your station administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
