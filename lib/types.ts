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
  sections: Section[];
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
    chosenStyle: VisualStyleId;      // after auto/manual resolution
    styleMode: StyleMode;
    moodAnswer?: string;
    vibeTags?: string[];             // user extra tags (max 3)
    canvasDurationSeconds?: 3 | 8;   // 3s or 8s
    selectedImage?: {
      url: string;
      prompt: string;
    };
    createdAt: string;
  };