import { NextResponse } from "next/server";
import { destroySession, sessionCookieName } from "@/lib/session";

export async function POST() {
  await destroySession();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete(sessionCookieName);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');
  return response;
}

export async function GET() {
  await destroySession();

  const response = NextResponse.redirect(new URL("/login?logged_out=1", process.env.NEXT_PUBLIC_APP_URL || "https://washdeck.vercel.app"));
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete(sessionCookieName);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');
  return response;
}
