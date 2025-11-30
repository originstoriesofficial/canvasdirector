import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature") || "";

  // ✅ verify webhook signature
  const hmac = crypto
    .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== hmac) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const email = event?.data?.attributes?.user_email?.toLowerCase();
  if (!email) return NextResponse.json({ ok: true });

  // ✅ store in Redis set of paid users
  await redis.sadd("paid-users", email);

  // ✅ increment quota (2 loops per purchase)
  const usageKey = `usage:${email}`;
  const current = (await redis.get<{ loopsUsed: number; quota: number }>(usageKey)) || { loopsUsed: 0, quota: 0 };
  current.quota += 2;
  await redis.set(usageKey, current);

  return NextResponse.json({ ok: true });
}
