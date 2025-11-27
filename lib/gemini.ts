// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { GeminiAnalysis } from "./types";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function analyzeAudioWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<GeminiAnalysis> {
  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `You are analyzing a music track for AI-generated Spotify canvas visuals.

Return ONLY valid JSON, no markdown, matching this TypeScript type exactly:

type SectionLabel =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "drop"
  | "bridge"
  | "outro"
  | "other";

type Section = {
  start: number; // seconds from start
  end: number;
  label: SectionLabel;
};

type GeminiAnalysis = {
  genre: string;
  moodTags: string[];          // 3–8 adjectives
  energyLevel: "low" | "medium" | "high";
  summary: string;             // 1–3 sentence description of the music
  visualHints: string[];       // 5–12 short visual concepts for the canvas
  sections: Section[];
};

Infer genre, mood, sections and visual hints from the audio.`,
        },
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
    },
  });
  

  const text = response.text ?? "{}";
  const parsed = JSON.parse(text) as GeminiAnalysis;
  return parsed;
}
