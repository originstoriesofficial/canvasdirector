import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature") || "";

  // ✅ Verify webhook signature
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

  // 🧾 Load paid users list
  const paidUsers = (await redis.get<string[]>("paid-users")) || [];
  if (!paidUsers.includes(email)) {
    paidUsers.push(email);
    await redis.set("paid-users", paidUsers);
  }

  // 🧮 Manage usage quotas
  const usage =
    (await redis.get<Record<string, { loopsUsed: number; quota: number }>>(
      "usage"
    )) || {};

  const current = usage[email] || { loopsUsed: 0, quota: 0 };
  usage[email] = {
    ...current,
    quota: current.quota + 2, // each purchase adds 2 loops
  };

  await redis.set("usage", usage);

  return NextResponse.json({ ok: true });
}
