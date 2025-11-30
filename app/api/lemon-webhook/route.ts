import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis"; // ✅ your Upstash client

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") || "";

    // ✅ Verify Lemon Squeezy webhook
    const hmac = crypto
      .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (signature !== hmac) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const email = event?.data?.attributes?.user_email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: true });
    }

    // ✅ Add email to Redis set of paid users
    await redis.sadd("paid-users", email);

    // ✅ Optional: increase user quota
    const usageKey = `usage:${email}`;
    const currentUsage = (await redis.hgetall(usageKey)) || { loopsUsed: 0, quota: 0 };
    const newQuota = Number(currentUsage.quota || 0) + 2;
    await redis.hset(usageKey, { loopsUsed: 0, quota: newQuota });

    console.log(`✅ Added paid user: ${email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
