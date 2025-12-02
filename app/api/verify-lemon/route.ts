import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" });
    }

    // 🔍 Check if the customer exists in Lemon Squeezy
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

    if (!res.ok) {
      const text = await res.text();
      console.error("Lemon API error:", text);
      return NextResponse.json({ ok: false, error: "Lemon API request failed" });
    }

    const data = await res.json();

    // ✅ Check for a matching email in the Lemon Squeezy response
    const hasCustomer =
      Array.isArray(data.data) &&
      data.data.some(
        (c: any) =>
          c?.attributes?.email?.toLowerCase() === email.toLowerCase() &&
          c?.attributes?.status === "subscribed"
      );

    // ✅ Prepare the response
    const response = NextResponse.json({ ok: hasCustomer });

    if (hasCustomer) {
      // ✅ Set a secure HttpOnly cookie for 30 days
      response.cookies.set({
        name: "vpm_email",
        value: email.toLowerCase(),
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      });
    }

    return response;
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
