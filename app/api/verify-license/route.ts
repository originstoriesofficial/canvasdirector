import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ ok: false, error: "Missing key" });
    }

    // 🍋 Validate license with Lemon Squeezy
    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
      },
      body: JSON.stringify({
        data: { type: "licenses", attributes: { key } },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Lemon API error:", data);
      return NextResponse.json({ ok: false, error: "Lemon API request failed" });
    }

    const valid = data?.data?.attributes?.valid || false;
    const email =
      data?.data?.attributes?.activation?.user_name?.toLowerCase?.() ||
      data?.data?.attributes?.email?.toLowerCase?.() ||
      "license-user";

    if (!valid) {
      return NextResponse.json({ ok: false, error: "Invalid or inactive license" });
    }

    // ✅ Set cookie for verified user
    const response = NextResponse.json({ ok: true, email });
    response.cookies.set({
      name: "vpm_email",
      value: email,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });

    console.log(`✅ License verified for ${email}`);
    return response;
  } catch (err) {
    console.error("License verification error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
