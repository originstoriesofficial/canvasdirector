import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LemonValidateResponse = {
  valid: boolean;
  error: string | null;
  license_key?: {
    id: number;
    status: "inactive" | "active" | "expired" | "disabled";
    key: string;
    activation_limit: number;
    activation_usage: number;
    created_at: string;
    expires_at: string | null;
  };
  instance?: {
    id: string;
    name: string;
    created_at: string;
  } | null;
  meta?: {
    customer_email?: string;
    customer_name?: string;
    product_name?: string;
    variant_name?: string;
    [key: string]: unknown;
  };
};

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, error: "Missing license key" }, { status: 400 });
    }

    // IMPORTANT: use your License API key here
    const apiKey = process.env.LEMON_LICENSE_API_KEY || process.env.LEMON_API_KEY;
    if (!apiKey) {
      console.error("Missing Lemon Squeezy API key env var");
      return NextResponse.json(
        { ok: false, error: "Server misconfigured. Contact support." },
        { status: 500 }
      );
    }

    const body = new URLSearchParams({
      license_key: key.trim(),
      // instance_id: "optional-machine-or-installation-id"
    });

    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    const data = (await res.json()) as LemonValidateResponse;

    if (!res.ok) {
      console.error("Lemon License API error:", data);
      return NextResponse.json(
        {
          ok: false,
          error: data.error || "Lemon Squeezy license validation failed",
        },
        { status: res.status }
      );
    }

    if (!data.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error || "Invalid or inactive license",
        },
        { status: 401 }
      );
    }

    const email =
      data.meta?.customer_email?.toLowerCase() ??
      data.meta?.customer_name?.toLowerCase?.() ??
      "license-user";

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
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
