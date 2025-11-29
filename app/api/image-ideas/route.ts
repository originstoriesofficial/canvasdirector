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

// === MODEL DEFINITIONS ===
const MODEL_CONFIG = [
  { id: "flux-2-flex", label: "Flux 2 Flex", model: "fal-ai/flux-2-flex" },
  { id: "imagen4-preview", label: "Imagen 4 Preview", model: "fal-ai/imagen4/preview" },
  { id: "nano-banana-pro", label: "Nano Banana Pro", model: "fal-ai/nano-banana-pro" },
] as const;

// === RANDOM HELPER ===
function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// === DYNAMIC PROMPT BUILDER ===
function buildBasePrompt(
  recipe: TrackRecipe,
  abstractOnly?: boolean,
  colorOverride?: string
): string {
  const { gemini, moodAnswer, vibeTags, chosenStyle } = recipe;

  const genre = gemini.genre?.toLowerCase() || "";
  const energy = gemini.energyLevel?.toLowerCase() || "medium";
  const mood = gemini.moodTags?.join(", ");
  const extraVibes = vibeTags?.length ? vibeTags.join(", ") : "";

  const genreTone: Record<string, string[]> = {
    techno: [
      "dark geometric minimalism, rhythmic light pulses, kinetic grids, clean symmetry",
      "metallic reflections, strobing energy, architectural precision",
    ],
    ambient: [
      "soft floating motion, ethereal mist, cosmic diffusion, watercolor light fields",
      "organic slow motion, meditative depth, flowing gradients, gentle bloom",
    ],
    pop: [
      "high fashion editorial energy, crystalline gloss, expressive color lighting",
      "surreal beauty shot aesthetic, cinematic glamour, artistic motion freeze",
    ],
    hiphop: [
      "urban surrealism, warm low-key lighting, lens flare energy, raw emotion",
      "chrome street visuals, expressive silhouettes, dust and glow, movement energy",
    ],
    rock: [
      "cinematic grunge realism, stage smoke and flares, dark reds and gold tones",
      "distorted lens energy, noise texture, rebellious surreal composition",
    ],
    cinematic: [
      "film still composition, atmospheric realism, golden light, poetic contrast",
      "award-winning visual tone, delicate lens bloom, deep depth of field",
    ],
  };

  const baseGenreDesc =
    choice(
      genreTone[
        Object.keys(genreTone).find((key) => genre.includes(key)) || "cinematic"
      ]
    ) || "";

  const energyStyle =
    energy === "high"
      ? choice([
          "rapid visual rhythm, high motion blur, dynamic movement",
          "strobing kinetic flow, explosive frame energy",
        ])
      : energy === "low"
      ? choice([
          "slow cinematic pacing, graceful motion, lingering atmosphere",
          "gentle panning, minimalist movement, soft transitions",
        ])
      : choice(["steady camera motion, elegant pacing, immersive composition"]);

  const styleRef: Record<string, string[]> = {
    "neon-city": [
      "futuristic neon metropolis, reflections in rain, moody cinematic haze",
      "holographic architecture, glowing wet pavement, cyber fashion energy",
    ],
    "vhs-dream": [
      "analog VHS grain, soft pink haze, nostalgic film lighting",
      "dreamlike retro aesthetic, gentle diffusion, analog beauty",
    ],
    "minimal-techno": [
      "clean geometric structure, dark ambient light, strobing grid design",
      "techno minimalism, black and chrome reflections, abstract repetition",
    ],
    "grainy-film": [
      "35mm film still, bokeh texture, analog realism, muted tones",
      "grain and scratches, poetic lighting, cinematic intimacy",
    ],
  };

  const styleDesc =
    choice(styleRef[chosenStyle] || [
      "award-winning surreal art direction, dreamlike cinematic contrast",
    ]);

  const abstractBlock = abstractOnly
    ? choice([
        "non-human figures, sculptural silhouettes, fragmented reflections",
        "abstract motion sculpture, no faces, alien crystalline shapes",
      ])
    : choice([
        "stylized humanoid figure, elegant movement, fashion-forward posture",
        "expressive human-like form, sculpted by light and shadow",
      ]);

  const lighting = choice([
    "volumetric lighting, cinematic fog, rim highlights",
    "dramatic side light, ambient bounce, golden reflections",
  ]);

  const colorText = colorOverride
    ? `color palette focus: ${colorOverride}, hue balance, glowing contrasts`
    : choice([
        "iridescent complementary palette, deep blue with warm highlights",
        "muted analog tones, golden light reflections",
      ]);

  const finish = choice([
    "award-winning composition, cinematic 4K frame, vertical 9:16 format",
    "fine art vertical composition, hyperreal detail, surreal elegance",
  ]);

  return [
    `Concept for a ${gemini.genre} track.`,
    `Mood: ${mood}.`,
    extraVibes && `Influence tags: ${extraVibes}.`,
    moodAnswer && `Artist direction: ${moodAnswer}.`,
    baseGenreDesc,
    styleDesc,
    energyStyle,
    abstractBlock,
    lighting,
    colorText,
    finish,
    "VPM Studio aesthetic — surreal elegance meets audio-driven motion.",
  ]
    .filter(Boolean)
    .join(" ");
}

// === IMAGE PROMPT VARIANTS ===
function buildImagePrompts(
  recipe: TrackRecipe,
  abstractOnly?: boolean,
  colorOverride?: string
) {
  const base = buildBasePrompt(recipe, abstractOnly, colorOverride);
  const hints = recipe.gemini.visualHints || [];

  const shots = [
    choice([
      "mid-shot composition, dynamic figure silhouette, floating shards of light",
      "portrait frame, fragmented reflection, ambient fog, surreal atmosphere",
      "side silhouette emerging from light, elegant motion",
    ]),
    choice([
      "wide establishing shot, dreamlike city or organic environment, depth and haze",
      "aerial top-down composition, flowing geometry, kinetic energy",
      "wide lens cinematic framing, strong backlight, scale and space",
    ]),
    choice([
      "macro texture close-up, crystal, smoke, fabric, or organic surface",
      "extreme close-up of light and color distortion",
      "bokeh transition texture, prismatic refracted details",
    ]),
  ];

  return shots.map((shot, i) => {
    const hint = hints[i] ? `Visual hint: ${hints[i]}.` : "";
    return `${base} ${shot}. ${hint}`;
  });
}

// === POST HANDLER ===
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
    const perModelCount = shotMode === "double" ? 2 : 1;

    const tasks = MODEL_CONFIG.flatMap((modelCfg) =>
      Array.from({ length: perModelCount }).map(async (_, i) => {
        const prompt = prompts[(i + Math.random() * prompts.length) % prompts.length | 0];

        const input =
          modelCfg.id === "flux-2-flex"
            ? {
                prompt,
                image_size: { width: 1080, height: 1920 }, // 9:16 vertical
                num_images: 1,
              }
            : {
                prompt,
                aspect_ratio: "9:16", // 9:16 for Imagen + Nano
                num_images: 1,
              };

        const result = await fal.subscribe(modelCfg.model, { input });
        const url =
          (result as any)?.data?.images?.[0]?.url ??
          (result as any)?.data?.image?.url ??
          "";

        return url
          ? { url, prompt, modelId: modelCfg.id }
          : null;
      })
    );

    const ideas = (await Promise.all(tasks)).filter(Boolean) as ImageIdea[];

    return NextResponse.json({ ideas }, { status: 200 });
  } catch (err) {
    console.error("image-ideas error", err);
    return NextResponse.json(
      { error: "Failed to generate image ideas" },
      { status: 500 }
    );
  }
}
