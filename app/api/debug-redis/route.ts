import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensures Upstash works

export async function GET() {
  try {
    const users = await redis.smembers("paid-users");
    return NextResponse.json({ paidUsers: users });
  } catch (err) {
    console.error("Redis debug error:", err);
    return NextResponse.json({ error: "Redis connection failed" }, { status: 500 });
  }
}
