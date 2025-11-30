import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";

export const config = {
  matcher: ["/canvas-director/:path*"],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const email = req.cookies.get("vpm_email")?.value?.toLowerCase();

  // 🧠 If no email cookie, redirect to checkout
  if (!email) {
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }

  // ✅ Fetch paid user list from Redis
  const paidUsers = (await redis.get<string[]>("paid-users")) || [];

  const hasAccess = paidUsers.some(
    (item) => typeof item === "string" && item.toLowerCase() === email
  );

  if (!hasAccess) {
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }

  // 🚀 Allow access if valid
  return NextResponse.next();
}
