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
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr_420px] md:items-center">
        <section className="max-w-xl">
          <WashDeckLogo className="mb-5 w-64 max-w-full" priority />
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
            Vehicle-first operations for modern car wash teams.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Open the daily queue, inspect vehicles, generate reports, collect payment, and keep every vehicle passport up to date.
          </p>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
