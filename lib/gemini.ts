// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiAnalysis } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "models/gemini-1.5-flash-8b", // or whatever you use
});

async function callGeminiOnce(
  base64Audio: string,
  mimeType: string
): Promise<GeminiAnalysis> {
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType,
            },
          },
          {
            text:
              "Analyze this track and return JSON with genre, energyLevel, moodTags, summary, visualHints[]",
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  const parsed = JSON.parse(text);

  // normalize to your GeminiAnalysis shape if needed
  return parsed as GeminiAnalysis;
}

export async function analyzeAudioWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<GeminiAnalysis> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callGeminiOnce(base64Audio, mimeType);
    } catch (err: any) {
      const status =
        err?.status ??
        err?.statusCode ??
        err?.error?.code ??
        err?.error?.status;

      const isOverloaded =
        status === 503 ||
        status === "UNAVAILABLE" ||
        err?.error?.status === "UNAVAILABLE";

      // Only retry on overload
      if (isOverloaded && attempt < maxRetries - 1) {
        const delayMs = 500 * (attempt + 1); // 0.5s, 1s, 1.5s
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      lastError = err;
      break;
    }
  }

  throw lastError ?? new Error("Gemini overloaded");
}
