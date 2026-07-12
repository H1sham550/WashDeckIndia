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
    <main className="flex min-h-screen items-center justify-center bg-slate-50/60 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-8 md:p-10 shadow-xl shadow-slate-100/50">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <WashDeckLogo className="h-24 w-auto object-contain" priority />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Access your detailing center workspace below.
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </main>
  );
}
