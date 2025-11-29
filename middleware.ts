import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/canvas-director")) return;

  const email = req.cookies.get("vpm_email")?.value;
  if (!email) {
    return NextResponse.redirect(new URL("/checkout", req.url));
  }

  const filePath = path.join(process.cwd(), "paid-users.json");
  let list: string[] = [];
  try {
    list = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    list = [];
  }

  if (!list.includes(email)) {
    return NextResponse.redirect(new URL("/checkout", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/canvas-director/:path*"],
};
