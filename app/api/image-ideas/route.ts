import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import type { TrackRecipe } from "@/lib/types";

export const runtime = "nodejs";

fal.config({
  credentials: process.env.FAL_KEY!,
});

type ImageIdea = {
  url: string;
  prompt: string;
  modelId: string;
};

type RequestBody = {
  recipe: TrackRecipe;
  abstractOnly?: boolean;
  shotMode?: "single" | "double";
  colorOverride?: string;
};

// ✅ Three concrete models with matching id/label/model
const MODEL_CONFIG = [
  {
    id: "flux-2-flex",
    label: "Flux 2 Flex",
    model: "fal-ai/flux-2-flex",
  },
  {
    id: "imagen4-preview",
    label: "Imagen 4 Preview",
    model: "fal-ai/imagen4/preview",
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    model: "fal-ai/nano-banana-pro",
  },
] as const;

function buildBasePrompt(
  recipe: TrackRecipe,
  abstractOnly: boolean | undefined,
  colorOverride: string | undefined
): string {
  const { gemini, moodAnswer, vibeTags, chosenStyle } = recipe;

  const styleText =
    chosenStyle === "neon-city"
      ? "vibrant neon city lights, futuristic, cinematic, vertical artwork"
      : chosenStyle === "vhs-dream"
      ? "soft VHS dream, retro glow, slight blur, film artifacts, vertical artwork"
      : chosenStyle === "minimal-techno"
      ? "minimalist techno visual, clean lines, geometric shapes, high contrast, vertical artwork"
      : "grainy 35mm film, cinematic framing, subtle grain, timeless, vertical artwork";

  const extraVibes = vibeTags && vibeTags.length ? vibeTags.join(", ") : "";
  const mood = gemini.moodTags.join(", ");

  const abstractBlock = abstractOnly
    ? "Abstract composition, no humans, no faces, no recognizable people, focus on shapes, light, textures."
    : "";

  const colorBlock = colorOverride
    ? `Color palette focus: ${colorOverride}.`
    : "";

  return [
    gemini.summary,
    mood && `Mood: ${mood}.`,
    extraVibes && `Extra vibe: ${extraVibes}.`,
    moodAnswer && `Artist direction: ${moodAnswer}.`,
    styleText,
    abstractBlock,
    colorBlock,
    "An award winning visual, cinematic, 4k, ultra detailed, no text, no logos, no watermarks, 9:16 aspect ratio",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildImagePrompts(
  recipe: TrackRecipe,
  abstractOnly?: boolean,
  colorOverride?: string
) {
  const base = buildBasePrompt(recipe, abstractOnly, colorOverride);
  const hints = recipe.gemini.visualHints || [];

  const h1 = hints.slice(0, 2).join(", ");
  const h2 = hints.slice(2, 4).join(", ");
  const h3 = hints.slice(4, 6).join(", ");

  const p1 = `${base} Focused composition: ${h1}.`;
  const p2 = `${base} Wider atmospheric shot: ${h2}.`;
  const p3 = `${base} Abstract motion and texture: ${h3}.`;

  return [p1, p2, p3];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const {
      recipe,
      abstractOnly = false,
      shotMode = "single",
      colorOverride,
    } = body;

    if (!recipe) {
      return NextResponse.json({ error: "Missing recipe" }, { status: 400 });
    }

    const prompts = buildImagePrompts(recipe, abstractOnly, colorOverride);

    // single = 1 per model (3 total), double = 2 per model (6 total)
    const perModelCount = shotMode === "double" ? 2 : 1;

    const ideas: ImageIdea[] = [];

    for (const modelCfg of MODEL_CONFIG) {
      for (let i = 0; i < perModelCount; i++) {
        const prompt = prompts[(i + ideas.length) % prompts.length];

        const result = await fal.subscribe(modelCfg.model, {
          input: {
            prompt,
            image_size: { width: 1080, height: 1920 },
            num_images: 1,
          },
        });

        const url =
          (result as any)?.data?.images?.[0]?.url ??
          (result as any)?.data?.image?.url ??
          "";

        if (!url) continue;

        ideas.push({
          url,
          prompt,
          modelId: modelCfg.id,
        });
      }
    }

    return NextResponse.json({ ideas }, { status: 200 });
  } catch (err) {
    console.error("image-ideas error", err);
    return NextResponse.json(
      { error: "Failed to generate image ideas" },
      { status: 500 }
    );
  }
}
