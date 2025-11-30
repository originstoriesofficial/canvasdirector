import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import paidUsers from "./paid-users.json";

export const config = {
  matcher: ["/canvas-director/:path*"],
};

// ✅ Explicitly declare type for imported JSON
const users: string[] = Array.isArray(paidUsers) ? (paidUsers as string[]) : [];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const email = req.cookies.get("vpm_email")?.value;

  // 🧠 Redirect to checkout if missing email cookie
  if (!email) {
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }

  // ✅ Properly typed and safe check
  const hasAccess = users.some(
    (item) => typeof item === "string" && item.toLowerCase() === email.toLowerCase()
  );

  if (!hasAccess) {
    url.pathname = "/checkout";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
