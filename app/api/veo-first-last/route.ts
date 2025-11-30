import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const email = req.cookies.get("vpm_email")?.value?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized: missing email cookie" },
        { status: 403 }
      );
    }

    // === Usage check ===
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

    // === Parse request ===
    const body = (await req.json().catch(() => null)) as {
      firstFrameUrl?: string;
      lastFrameUrl?: string;
      firstPrompt?: string;
      lastPrompt?: string;
      moodAnswer?: string;
      vibeInput?: string;
    } | null;

    if (!body?.firstFrameUrl || !body?.lastFrameUrl) {
      return NextResponse.json(
        { error: "Missing firstFrameUrl or lastFrameUrl" },
        { status: 400 }
      );
    }

    const {
      firstFrameUrl,
      lastFrameUrl,
      firstPrompt = "",
      lastPrompt = "",
      moodAnswer = "",
      vibeInput = "",
    } = body;

    // === Build motion prompt ===
    const motionPromptParts = [
      firstPrompt,
      lastPrompt && `The scene gradually transitions into: ${lastPrompt}.`,
      moodAnswer && `Overall mood: ${moodAnswer}.`,
      vibeInput && `Extra vibe tags: ${vibeInput}.`,
      "Cinematic, award-winning vertical composition, subtle camera motion.",
      "Elegant pacing, ambient energy, smooth visual flow between first and last frame.",
      "No abrupt cuts, no text, no logos — seamless 9:16 loop for audio-visual storytelling.",
    ].filter(Boolean);

    const prompt = motionPromptParts.join(" ");

    // === Generate via FAL ===
    const result = await fal.subscribe(
      "fal-ai/veo3.1/first-last-frame-to-video",
      {
        input: {
          first_frame_url: firstFrameUrl,
          last_frame_url: lastFrameUrl,
          prompt,
          duration: "8s",
          aspect_ratio: "9:16",
          resolution: "1080p",
          generate_audio: false,
        } as any,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.forEach((log) => console.log(log.message));
          }
        },
      }
    );

    const videoUrl =
      (result as any)?.data?.video?.url ||
      (result as any)?.data?.videos?.[0]?.url ||
      "";

    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL returned from Veo" },
        { status: 500 }
      );
    }

    // ✅ Increment usage after success
    user.loopsUsed++;
    usage[email] = user;
    await redis.set("usage", usage);

    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (err) {
    console.error("veo-first-last error", err);
    return NextResponse.json(
      { error: "Failed to generate Veo video" },
      { status: 500 }
    );
  }
}
