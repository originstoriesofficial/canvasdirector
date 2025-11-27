// app/api/veo-first-last/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as {
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

    const motionPromptParts = [
      firstPrompt,
      lastPrompt && `The scene gradually transitions into: ${lastPrompt}.`,
      moodAnswer && `Overall mood: ${moodAnswer}.`,
      vibeInput && `Extra vibe tags: ${vibeInput}.`,
      "Cinematic, award-winning visual, subtle camera motion, elegant for classical and ambient music.",
      "Smooth transition between first and last frame, no abrupt cuts, loop-friendly feeling.",
    ].filter(Boolean);

    const prompt = motionPromptParts.join(" ");

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
        } as any, // keep TS happy even if types change upstream
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.forEach((log) => console.log(log.message));
          }
        },
      }
    );

    const videoUrl = (result as any)?.data?.video?.url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL returned from Veo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (err) {
    console.error("veo-first-last error", err);
    return NextResponse.json(
      { error: "Failed to generate Veo video" },
      { status: 500 }
    );
  }
}
