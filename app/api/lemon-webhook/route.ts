import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const filePath = path.join(process.cwd(), "paid-users.json");

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature") || "";

  const hmac = crypto
    .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== hmac) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const email = event?.data?.attributes?.user_email;
  if (!email) return NextResponse.json({ ok: true });

  // Read current list
  let list: string[] = [];
  try {
    list = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    list = [];
  }

  // Add if not already there
  if (!list.includes(email)) {
    list.push(email);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
  }

  return NextResponse.json({ ok: true });
}
