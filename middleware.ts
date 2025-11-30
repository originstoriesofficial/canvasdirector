// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis"; // ✅ Ensure you have lib/redis.ts configured

export const config = {
  matcher: ["/canvas-director/:path*"],
};

export const runtime = "experimental-edge";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const email = req.cookies.get("vpm_email")?.value?.toLowerCase();

  // 🚫 If no cookie → redirect to checkout
  if (!email) {
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }

  try {
    // ✅ Check Redis for paid user
    const isPaid = await redis.sismember("paid-users", email);

    if (!isPaid) {
      url.pathname = "/checkout";
      return NextResponse.redirect(url);
    }

    // ✅ User verified → allow access
    return NextResponse.next();
  } catch (err) {
    console.error("Redis middleware error:", err);
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }
}
