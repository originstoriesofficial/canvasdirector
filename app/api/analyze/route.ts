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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

function autoPickStyle(g: GeminiAnalysis): VisualStyleId {
  const genre = g.genre.toLowerCase();
  const energy = g.energyLevel;

  if (genre.includes("techno") || genre.includes("minimal")) return "minimal-techno";
  if (genre.includes("indie") || genre.includes("lo-fi") || genre.includes("lofi")) return "vhs-dream";
  if (genre.includes("orchestral") || genre.includes("cinematic")) return "grainy-film";
  if (energy === "high") return "neon-city";
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

    if (file.size > 8_000_000) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });
    }

    const styleMode: StyleMode = styleModeRaw ?? "auto";
    const canvasDurationSeconds: 3 | 8 = durationRaw === "3" ? 3 : 8;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    const mimeType = file.type || "audio/mpeg";

    // 🔍 Analyze audio using Gemini (can switch to URL-based if supported)
    const gemini = await analyzeAudioWithGemini(base64Audio, mimeType);
    const vibeTags = parseVibeTags(vibeInput);

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
  } catch (error) {
    console.error("Analyze route error", error);
    return NextResponse.json({ error: "Failed to analyze audio" }, { status: 500 });
  }
}
