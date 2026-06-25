import { redirect } from "next/navigation";
import { WashDeckLogo } from "@/components/brand/washdeck-logo";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      <div className="grid w-full grid-cols-1 md:grid-cols-[1.1fr_1fr] lg:grid-cols-[1.3fr_1fr]">
        {/* Left Panel - Premium Brand Showcase (Visible on MD and up) */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#07162c] via-[#0b2240] to-[#0f3564] p-12 text-white md:flex">
          {/* Subtle Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px"
            }}
          />

          {/* Glowing Ambient Lights */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-90 w-90 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Top Branding Header */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-md">
              <span className="text-[#0b2240] font-black text-lg">W</span>
            </div>
            <span className="text-lg font-bold tracking-wider">WashDeck OS</span>
          </div>

          {/* Centerpiece: Marketing message and Live-looking glass card */}
          <div className="relative z-10 my-auto max-w-lg space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl">
                The Operating System for Detailing Centers.
              </h1>
              <p className="text-slate-300 text-base leading-relaxed">
                Empower your detailing and car wash teams with live queue management, digital vehicle passports, instant reports, and automatic revenue recovery tools.
              </p>
            </div>

            {/* Platform Capabilities Showcase Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Integrated Operations Suite</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-semibold text-slate-200">
                  Active Modules
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Module 1 */}
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 hover:border-white/10 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <h4 className="text-xs font-bold">Queue Manager</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Live queue tracking & digital job cards.</p>
                </div>

                {/* Module 2 */}
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 hover:border-white/10 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-sky-400" />
                    <h4 className="text-xs font-bold">Vehicle Passport</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Comprehensive service history & inspections.</p>
                </div>

                {/* Module 3 */}
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 hover:border-white/10 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                    <h4 className="text-xs font-bold">Revenue Recovery</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Automated reminders & recovery pipelines.</p>
                </div>

                {/* Module 4 */}
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 hover:border-white/10 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-amber-450" style={{ backgroundColor: "#f59e0b" }} />
                    <h4 className="text-xs font-bold">Business Intelligence</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">Analytics, customer retention, and insights.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} WashDeck Technologies. All rights reserved.
          </div>
        </section>

        {/* Right Panel - Sign In Form */}
        <section 
          className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 bg-white shadow-2xl md:shadow-none"
          style={{ "--primary-color": "#0b2240" } as React.CSSProperties}
        >
          <div className="mx-auto w-full max-w-md space-y-8">
            {/* Logo Container - blending the white logo background seamlessly */}
            <div className="flex flex-col items-center text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-sm inline-block mb-4">
                <WashDeckLogo className="h-12 w-auto object-contain" priority />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Access your detailing center workspace below.
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
