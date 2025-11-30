import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

fal.config({
  credentials: process.env.FAL_KEY!,
});

// === CAMERA MOTION HELPER ===
function buildCameraMotionText(cameraMotion: string): string {
  switch (cameraMotion) {
    case "zoom-in":
      return "The camera slowly zooms in towards the subject.";
    case "zoom-out":
      return "The camera slowly zooms out, revealing more of the scene.";
    case "circle-pan":
      return "The camera slowly circles around the subject with smooth orbital motion.";
    case "swirl":
      return "The camera moves in a subtle swirling motion around the subject.";
    default:
      return "The camera holds a gentle, steady framing with minimal movement.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = req.cookies.get("vpm_email")?.value?.toLowerCase();

    // 🔒 Require cookie
    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized: missing email cookie" },
        { status: 403 }
      );
    }

    // === Usage control via Redis ===
    const usage =
      (await redis.get<Record<string, { loopsUsed: number; quota: number }>>(
        "usage"
      )) || {};

    const user = usage[email] || { loopsUsed: 0, quota: 2 };

    if (user.loopsUsed >= user.quota) {
      return NextResponse.json(
        {
          error:
            "Loop limit reached. Each purchase grants 2 loops — please repurchase to unlock more.",
        },
        { status: 403 }
      );
    }

    // === Parse form data ===
    const form = await req.formData();
    const imageUrl = form.get("imageUrl") as string | null;
    const imagePrompt = (form.get("imagePrompt") as string | null) ?? "";
    const cameraMotion = (form.get("cameraMotion") as string | null) ?? "zoom-in";
    const durationRaw = (form.get("duration") as string | null) ?? "5";

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const wanDuration: "5" | "10" = durationRaw === "10" ? "10" : "5";

    const motionText = buildCameraMotionText(cameraMotion);

    const videoPrompt = [
      imagePrompt,
      "An award-winning cinematic shot.",
      motionText,
      "Smooth, filmic motion, loopable feeling, vertical 9:16 frame, no text or logos, 4K detail.",
    ]
      .filter(Boolean)
      .join(" ");

    // === Generate via FAL ===
    const result = await fal.subscribe("fal-ai/wan-25-preview/image-to-video", {
      input: {
        prompt: videoPrompt,
        image_url: imageUrl,
        resolution: "1080p",
        duration: wanDuration,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.forEach((log) => console.log(log.message));
        }
      },
    });

    const videoUrl =
      (result as any)?.data?.video?.url ||
      (result as any)?.data?.videos?.[0]?.url ||
      "";

    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL returned from WAN" },
        { status: 500 }
      );
    }

    // ✅ Increment usage after success
    user.loopsUsed++;
    usage[email] = user;
    await redis.set("usage", usage);

    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (err: any) {
    console.error("image-to-video error", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}
