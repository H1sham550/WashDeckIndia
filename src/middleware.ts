import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";
import { sessionCookieName, type SessionUser } from "@/lib/session";

const protectedPrefixes = ["/dashboard", "/admin"];

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY RISK: SESSION_SECRET is not configured in production environment.");
    }
    return new TextEncoder().encode("washdeck-local-development-fallback-secret-key-32-chars");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) || 
                      pathname === "/reset-password" || 
                      pathname === "/onboarding";

  if (!isProtected) {
    return NextResponse.next();
  }

  const secret = getSecret();
  const token = request.cookies.get(sessionCookieName)?.value;

  if (!secret || !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify<SessionUser>(token, secret);

    // 1. Enforce password reset if temporary
    if (payload.isTempPassword) {
      if (pathname !== "/reset-password") {
        return NextResponse.redirect(new URL("/reset-password", request.url));
      }
      return NextResponse.next();
    }

    // 2. Prevent access to reset-password if already changed
    if (pathname === "/reset-password") {
      return NextResponse.redirect(new URL(payload.role === "SUPER_ADMIN" ? "/admin" : "/dashboard", request.url));
    }

    // 3. Super Admin vs Owner/Staff role redirection
    if (pathname.startsWith("/admin") && payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard") && payload.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/reset-password", "/onboarding"],
};
