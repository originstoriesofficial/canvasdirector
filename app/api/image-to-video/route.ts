// app/api/image-to-video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";

fal.config({
  credentials: process.env.FAL_KEY!,
});

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
    const form = await req.formData();

    const imageUrl = form.get("imageUrl") as string | null;
    const imagePrompt = (form.get("imagePrompt") as string | null) ?? "";
    const cameraMotion =
      (form.get("cameraMotion") as string | null) ?? "zoom-in";
    const durationRaw = (form.get("duration") as string | null) ?? "5";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    // Map our 3/8s to WAN's "5"/"10" (string union)
    const wanDuration: "5" | "10" = durationRaw === "10" ? "10" : "5";

    const motionText = buildCameraMotionText(cameraMotion);

    const videoPrompt = [
      imagePrompt,
      "An award winning cinematic shot.",
      motionText,
      "Smooth, filmic motion, loopable feeling, 4k look.",
    ]
      .filter(Boolean)
      .join(" ");

    // MINIMAL, VALID INPUT FOR WAN 2.5 I2V
    const result = await fal.subscribe(
      "fal-ai/wan-25-preview/image-to-video",
      {
        input: {
          prompt: videoPrompt,
          image_url: imageUrl,
          // Canvas is vertical & we want high quality
          resolution: "1080p",
          duration: wanDuration, // "5" | "10"
          // If needed later, we can reintroduce negative_prompt / other flags
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.forEach((log) => {
              console.log(log.message);
            });
          }
        },
      }
    );

    const videoUrl = result.data?.video?.url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL returned from WAN" },
        { status: 500 }
      );
    }

    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (err: any) {
    console.error("image-to-video error", err);
    // surfaces Fal error message a bit better for debugging
    return NextResponse.json(
      { error: err?.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}
