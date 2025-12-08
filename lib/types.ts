// lib/types.ts

export type SectionLabel =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "drop"
  | "bridge"
  | "outro"
  | "other";

export type Section = {
  start: number; // seconds
  end: number;   // seconds
  label: SectionLabel;
};

export type GeminiAnalysis = {
  genre: string;
  moodTags: string[];
  energyLevel: "low" | "medium" | "high";
  summary: string;
  visualHints: string[];

  // 🔥 FIX: Gemini doesn't always return this, so it MUST be optional:
  sections?: Section[];
};

export type VisualStyleId =
  | "neon-city"
  | "vhs-dream"
  | "minimal-techno"
  | "grainy-film"
  | "dream-glow"
  | "glitch-pulse"
  | "monochrome-motion"
  | "urban-haze"
  | "color-burst"
  | "slow-pan-cinema";

export type StyleMode = "auto" | "manual";

export type TrackRecipe = {
  id: string;
  gemini: GeminiAnalysis;
  chosenStyle: VisualStyleId;
  styleMode: StyleMode;
  moodAnswer?: string;
  vibeTags?: string[];
  canvasDurationSeconds?: 5 | 8;
  selectedImage?: {
    url: string;
    prompt: string;
  };
  createdAt: string;
};
