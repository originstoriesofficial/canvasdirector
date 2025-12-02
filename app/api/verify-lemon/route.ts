import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.canvasdirector_KV_REST_API_URL!,
  token: process.env.canvasdirector_KV_REST_API_TOKEN!,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: false, error: "Missing email" });

    // ✅ Check Lemon API for that customer
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/customers?filter[email]=${encodeURIComponent(email)}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        },
      }
    );

    const data = await res.json();
    const isPaid = Array.isArray(data.data) && data.data.length > 0;

    if (isPaid) {
      await redis.sadd("paid-users", email.toLowerCase());
    }

    return NextResponse.json({ ok: isPaid });
  } catch (err) {
    console.error("Verify Lemon Error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
