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

// ✅ Models
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

// 🎨 Randomizer helper
function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// === DYNAMIC PROMPT GENERATOR ===
function buildBasePrompt(
  recipe: TrackRecipe,
  abstractOnly: boolean | undefined,
  colorOverride: string | undefined
): string {
  const { gemini, moodAnswer, vibeTags, chosenStyle } = recipe;

  const genre = gemini.genre?.toLowerCase() || "";
  const energy = gemini.energyLevel?.toLowerCase() || "medium";
  const mood = gemini.moodTags?.join(", ");
  const extraVibes = vibeTags?.length ? vibeTags.join(", ") : "";

  // === GENRE STYLES ===
  const genreTone: Record<string, string[]> = {
    techno: [
      "dark geometric minimalism, rhythmic light pulses, kinetic grids, clean symmetry",
      "monochrome palette, metallic reflections, strobing energy, architectural precision",
      "neon abstract forms, chrome reflections, motion-driven design aesthetic",
    ],
    ambient: [
      "soft floating motion, ethereal mist, cosmic diffusion, watercolor light fields",
      "organic slow motion, meditative depth, flowing gradients, gentle bloom",
      "dreamlike particles in suspension, calm spectral energy, fluid transitions",
    ],
    pop: [
      "high fashion editorial energy, crystalline gloss, expressive color lighting",
      "surreal beauty shot aesthetic, cinematic glamour, artistic motion freeze",
      "dynamic stage lighting, confetti textures, fashion-forward poses",
    ],
    hiphop: [
      "urban surrealism, warm low-key lighting, lens flare energy, raw emotion",
      "chrome street visuals, expressive silhouettes, dust and glow, movement energy",
      "fashion + grit hybrid look, high contrast color blocking",
    ],
    rock: [
      "cinematic grunge realism, stage smoke and flares, dark reds and gold tones",
      "distorted lens energy, noise texture, rebellious surreal composition",
      "fragmented cinematic flash, dramatic shadows, emotional edge",
    ],
    cinematic: [
      "film still composition, atmospheric realism, golden light, poetic contrast",
      "award-winning visual tone, delicate lens bloom, deep depth of field",
      "moody film grain, dramatic chiaroscuro, elegant negative space",
    ],
  };

  const baseGenreDesc =
    choice(
      genreTone[
        Object.keys(genreTone).find((key) => genre.includes(key)) || "cinematic"
      ]
    ) || "";

  // === ENERGY VARIATION ===
  const energyStyle =
    energy === "high"
      ? choice([
          "rapid visual rhythm, high motion blur, dynamic movement",
          "strobing kinetic flow, explosive frame energy",
          "fast camera transitions, fragmented light motion",
        ])
      : energy === "low"
      ? choice([
          "slow cinematic pacing, lingering camera, graceful motion",
          "gentle panning, meditative atmosphere, minimalist movement",
          "soft visual rhythm, breathing composition, subtle transition",
        ])
      : choice([
          "steady camera motion, elegant pacing, immersive composition",
          "balanced visual rhythm, smooth cinematic timing",
        ]);

  // === STYLE PRESETS ===
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

  // === ABSTRACT OR HUMAN ===
  const abstractBlock = abstractOnly
    ? choice([
        "non-human figures, sculptural silhouettes, fragmented reflections, refracted geometry",
        "abstract motion and light sculpture, no faces, alien crystalline shapes",
        "fluid architecture of color, reflective surfaces, shape-driven narrative",
      ])
    : choice([
        "stylized humanoid figure, elegant movement, fashion-forward posture",
        "expressive human-like form, sculpted by light and shadow",
        "cinematic character presence, mysterious figure in motion",
      ]);

  const lighting = choice([
    "volumetric lighting, cinematic fog, rim highlights",
    "dramatic side light, ambient bounce, golden reflections",
    "moody spotlight diffusion, film-style gradient light",
  ]);

  const colorText = colorOverride
    ? `color palette focus: ${colorOverride}, hue balance, glowing contrasts`
    : choice([
        "iridescent complementary palette, deep blue with warm highlights",
        "muted analog tones, golden light reflections",
        "high-contrast palette, pinks and cyans in cinematic bloom",
      ]);

  const finish = choice([
    "award-winning composition, cinematic 4K frame, surreal energy, vertical 9:16 format",
    "fashion editorial lighting, dynamic tone range, no text, no watermark, vertical aspect",
    "motion-driven fine art still, hyperreal texture, vertical film frame",
  ]);

  // === FINAL DYNAMIC PROMPT ===
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

// === IMAGE PROMPTS ===
function buildImagePrompts(
  recipe: TrackRecipe,
  abstractOnly?: boolean,
  colorOverride?: string
) {
  const base = buildBasePrompt(recipe, abstractOnly, colorOverride);
  const hints = recipe.gemini.visualHints || [];

  const cinematicShots = [
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

  return cinematicShots.map((shot, i) => {
    const extra = hints[i] ? `Visual hint: ${hints[i]}.` : "";
    return `${base} ${shot}. ${extra}`;
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
