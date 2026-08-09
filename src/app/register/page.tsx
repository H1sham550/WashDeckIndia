import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { Sparkles, Building2, ShieldCheck, CheckCircle } from "lucide-react";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ background: "#F8F9FA" }}>
      <header className="border-b border-slate-200/80 bg-white px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/logo-icon.png" alt="WashDeck" className="h-9 w-auto object-contain" />
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">WashDeck India</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Car Wash Operations POS</p>
          </div>
        </div>
        <Link
          href="/login"
          className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline transition"
        >
          Already have an account? Sign In
        </Link>
      </header>

      <div className="py-10 px-4 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8 space-y-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles size={14} />
            30-Day Free Trial • No Credit Card Required
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Register Your Car Wash Store Account
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Get your station up and running in minutes with full POS queueing, wash pricing controls, WhatsApp customer reporting, and expense tracking.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
          <RegisterForm />
        </div>
      </div>

      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
        © 2026 WashDeck India Operations Management System.
      </footer>
    </main>
  );
}
