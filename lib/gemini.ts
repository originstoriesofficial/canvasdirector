// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { GeminiAnalysis } from "./types";

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function analyzeAudioWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<GeminiAnalysis> {
  const contents = [
    {
      text: [
        "You are a music analysis engine.",
        "Listen to the audio and return ONLY a JSON object with this exact shape:",
        "",
        "{",
        '  "genre": string,',
        '  "energyLevel": "low" | "medium" | "high",',
        '  "moodTags": string[],',
        '  "visualHints": string[],',
        '  "summary": string',
        "}",
        "",
        "Constraints:",
        "- moodTags: 3–6 short lowercase tags.",
        "- visualHints: 6 short visual scene prompts.",
        "- summary: 1–2 sentences.",
        "- Do NOT wrap in markdown or code fences. Output raw JSON only.",
      ].join("\n"),
    },
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents,
  });

  // NOTE: property, not function
  const text = response.text ?? "";

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("Gemini JSON parse failed. Raw response:", text);
    throw new Error("Gemini response was not valid JSON");
  }

  const result: GeminiAnalysis = {
    genre: parsed.genre ?? "unknown",
    energyLevel: parsed.energyLevel ?? "medium",
    moodTags: Array.isArray(parsed.moodTags) ? parsed.moodTags : [],
    visualHints: Array.isArray(parsed.visualHints) ? parsed.visualHints : [],
    summary: parsed.summary ?? "",
  };

  return result;
}
