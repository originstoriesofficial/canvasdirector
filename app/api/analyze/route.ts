import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { analyzeAudioWithGemini } from "@/lib/gemini";
import type {
  TrackRecipe,
  VisualStyleId,
  StyleMode,
  GeminiAnalysis,
} from "@/lib/types";

export const runtime = "nodejs";

// Only relevant for old pages/api, but harmless here
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

// 🎨 AI-based fallback style selection
function autoPickStyle(g: GeminiAnalysis): VisualStyleId {
  const genre = g.genre.toLowerCase();

  if (genre.includes("techno") || genre.includes("minimal"))
    return "minimal-techno";

  if (genre.includes("indie") || genre.includes("lo-fi") || genre.includes("lofi"))
    return "vhs-dream";

  if (
    genre.includes("edm") ||
    genre.includes("dance") ||
    genre.includes("pop") ||
    genre.includes("club")
  )
    return "neon-city";

  if (genre.includes("orchestral") || genre.includes("cinematic"))
    return "grainy-film";

  // safe, neutral default
  return "grainy-film";
}

function parseVibeTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function isOverloadedError(error: any): boolean {
  const status =
    error?.status ??
    error?.statusCode ??
    error?.error?.code ??
    error?.error?.status;

  return status === 503 || status === "UNAVAILABLE";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const chosenStyleRaw = form.get("chosenStyle") as VisualStyleId | null;
    const styleModeRaw = form.get("styleMode") as StyleMode | null;
    const moodAnswer = form.get("moodAnswer") as string | null;
    const vibeInput = form.get("vibeInput") as string | null;
    const durationRaw = form.get("duration") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // 8MB cap for now (safe for Gemini audio)
    if (file.size > 8_000_000) {
      return NextResponse.json(
        { error: "File too large (max 8MB)" },
        { status: 413 }
      );
    }

    const styleMode: StyleMode = styleModeRaw ?? "auto";
    const canvasDurationSeconds: 5 | 8 = durationRaw === "5" ? 5 : 8;

    // 🧠 Analyze audio with Gemini (your lib function can have retry logic internally)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    const mimeType = file.type || "audio/mpeg";

    const gemini = await analyzeAudioWithGemini(base64Audio, mimeType);
    const vibeTags = parseVibeTags(vibeInput);

    // 🎯 Only use chosenStyleRaw if manual mode; otherwise auto-pick from analysis
    const chosenStyle: VisualStyleId =
      styleMode === "manual" && chosenStyleRaw
        ? chosenStyleRaw
        : autoPickStyle(gemini);

    const recipe: TrackRecipe = {
      id: randomUUID(),
      gemini,
      chosenStyle,
      styleMode,
      moodAnswer: moodAnswer || undefined,
      vibeTags,
      canvasDurationSeconds,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(recipe, { status: 200 });
  } catch (error: any) {
    console.error("Analyze route error", error);

    if (isOverloadedError(error)) {
      return NextResponse.json(
        {
          error: "AI analyzer is overloaded. Please try again in a moment.",
          code: "MODEL_OVERLOADED",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze audio", code: "ANALYZE_FAILED" },
      { status: 500 }
    );
  }
}
