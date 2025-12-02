// app/api/test-redis/route.ts
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.canvasdirector_KV_REST_API_URL!,
  token: process.env.canvasdirector_KV_REST_API_TOKEN!,
});

export const runtime = "nodejs";

export async function GET() {
  try {
    const pong = await redis.ping();
    return NextResponse.json({ ok: true, pong });
  } catch (err: any) {
    console.error("Redis error:", err);
    return NextResponse.json({ ok: false, error: String(err.message || err) });
  }
}
