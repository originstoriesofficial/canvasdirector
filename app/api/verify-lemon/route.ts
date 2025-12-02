import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

interface LemonCustomer {
  attributes: {
    email: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" });
    }

    // 🟢 Check Redis first (faster + immediate after webhook)
    const isPaid = await redis.sismember("paid-users", email.toLowerCase());
    if (isPaid) {
      console.log("✅ Verified via Redis:", email);
      return NextResponse.json({ ok: true });
    }

    // 🟡 Fallback to Lemon API (in case Redis doesn’t have it yet)
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/customers?filter[email]=${encodeURIComponent(
        email
      )}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Lemon API error:", text);
      return NextResponse.json({ ok: false, error: "Lemon API request failed" });
    }

    const data = await res.json();

    // ✅ Add explicit type so TS is happy
    const hasCustomer =
      Array.isArray(data.data) &&
      (data.data as LemonCustomer[]).some(
        (c) => c.attributes.email.toLowerCase() === email.toLowerCase()
      );

    console.log("✅ Verified via Lemon API:", { email, hasCustomer });

    return NextResponse.json({ ok: hasCustomer });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
