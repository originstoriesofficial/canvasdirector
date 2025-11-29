"use client";

import React, { useState } from "react";
import type { TrackRecipe, VisualStyleId, StyleMode } from "@/lib/types";

type ImageIdea = { url: string; prompt: string; modelId: string };
type ShotMode = "single" | "double";
type CameraMotion = "zoom-in" | "zoom-out" | "circle-pan" | "swirl" | "static";

const VISUAL_STYLES: {
  id: VisualStyleId;
  label: string;
  description: string;
}[] = [
  {
    id: "neon-city",
    label: "Neon City",
    description: "EDM / pop, bright neon, fast motion",
  },
  {
    id: "vhs-dream",
    label: "VHS Dream",
    description: "Indie / lo-fi, soft, retro tape feel",
  },
  {
    id: "minimal-techno",
    label: "Minimal Techno",
    description: "Dark, clean lines, geometric",
  },
  {
    id: "grainy-film",
    label: "Grainy Film",
    description: "Organic, cinematic, textured",
},
{
  id: "dream-glow",
  label: "Dream Glow",
  description: "Ethereal, pastel gradients, soft camera motion",
},
{
  id: "glitch-pulse",
  label: "Glitch Pulse",
  description: "Digital distortion, syncs to beat, high energy",
},
{
  id: "monochrome-motion",
  label: "Monochrome Motion",
  description: "Black-and-white, minimal, cinematic lighting",
},
{
  id: "urban-haze",
  label: "Urban Haze",
  description: "Hip-hop / R&B vibe, moody lights, grain and contrast",
},
{
  id: "color-burst",
  label: "Color Burst",
  description: "Psychedelic animation, flowing color transitions",
},
{
  id: "slow-pan-cinema",
  label: "Slow Pan Cinema",
  description: "Cinematic slow-motion pans, muted tones, emotional",
}
];

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [styleMode, setStyleMode] = useState<StyleMode>("auto");
  const [chosenStyle, setChosenStyle] = useState<VisualStyleId>("neon-city");
  const [vibeInput, setVibeInput] = useState("");
  const [moodAnswer, setMoodAnswer] = useState("");
  const [colorOverride, setColorOverride] = useState("");

  const [shotMode, setShotMode] = useState<ShotMode>("single");
  const [abstractOnly, setAbstractOnly] = useState(false);

  const [status, setStatus] = useState("Upload a track to begin.");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<TrackRecipe | null>(null);

  const [imageIdeas, setImageIdeas] = useState<ImageIdea[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageIdea | null>(null);

  const [cameraMotion, setCameraMotion] = useState<CameraMotion>("zoom-in");

  const [wanVideoUrl, setWanVideoUrl] = useState<string | null>(null);
  const [wanLoading, setWanLoading] = useState(false);

  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [veoLoading, setVeoLoading] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  const [veoFirst, setVeoFirst] = useState<ImageIdea | null>(null);
  const [veoLast, setVeoLast] = useState<ImageIdea | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (f) {
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
      setStatus("Track loaded. Configure style and analyze.");
    } else {
      setStatus("Upload a track to begin.");
    }
    setRecipe(null);
    setImageIdeas([]);
    setSelectedImage(null);
    setWanVideoUrl(null);
    setVeoVideoUrl(null);
    setRetryCount(0);
    setVeoFirst(null);
    setVeoLast(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setStatus("Analyzing track with AI…");
    setRecipe(null);
    setImageIdeas([]);
    setSelectedImage(null);
    setWanVideoUrl(null);
    setVeoVideoUrl(null);
    setRetryCount(0);
    setVeoFirst(null);
    setVeoLast(null);

    const form = new FormData();
    form.append("file", file);
    form.append("chosenStyle", chosenStyle);
    form.append("moodAnswer", moodAnswer);
    form.append("styleMode", styleMode);
    form.append("vibeInput", vibeInput);
    form.append("duration", shotMode === "single" ? "5" : "8");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Analysis failed");
      }

      const data = (await res.json()) as TrackRecipe;
      setRecipe(data);
      await generateImageIdeas(data);
      setStatus("Analysis complete. Pick a visual and generate your video.");
    } catch (err) {
      console.error(err);
      setStatus("Error analyzing audio. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function generateImageIdeas(
    newRecipe: TrackRecipe,
    isRetry = false
  ): Promise<void> {
    if (isRetry && retryCount >= 1) return;

    setStatus(
      isRetry ? "Retrying visual concepts…" : "Crafting visual concepts…"
    );
    setImageIdeas([]);
    setSelectedImage(null);
    setVeoFirst(null);
    setVeoLast(null);

    const res = await fetch("/api/image-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe: newRecipe,
        abstractOnly,
        shotMode,
        colorOverride,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Failed to generate images");
    }

    const data = (await res.json()) as { ideas: ImageIdea[] };
    setImageIdeas(data.ideas);
    if (data.ideas[0]) {
      setSelectedImage(data.ideas[0]);
    }

    if (isRetry) {
      setRetryCount((prev) => prev + 1);
    }

    setStatus(
      "Concepts ready. Choose your favorite and generate a 5–8s canvas."
    );
  }

  async function handleGenerateWanVideo() {
    if (!selectedImage || !file) {
      alert("Please select a visual and upload a track first.");
      return;
    }
    if (shotMode !== "single") {
      alert("Set output type to 'Single shot (5s)'.");
      return;
    }

    try {
      setWanLoading(true);
      setStatus("Generating single-shot 5s loop…");

      const form = new FormData();
      form.append("imageUrl", selectedImage.url);
      form.append("imagePrompt", selectedImage.prompt);
      form.append("cameraMotion", cameraMotion);
      form.append("duration", "5");
      form.append("audioFile", file);

      const res = await fetch("/api/image-to-video", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Failed to generate video");
      }

      const data = (await res.json()) as { videoUrl: string };
      setWanVideoUrl(data.videoUrl);
      setStatus("Single-shot loop ready. Preview or download below.");
    } catch (err) {
      console.error(err);
      setStatus("Error generating single-shot video. Check console.");
    } finally {
      setWanLoading(false);
    }
  }

  async function handleGenerateVeoVideo() {
    if (imageIdeas.length === 0) {
      alert("Run analysis and generate concepts first.");
      return;
    }
    if (shotMode !== "double") {
      alert("Set output type to 'Two shots (5–8s)' for Veo.");
      return;
    }
    if (!veoFirst || !veoLast) {
      alert("Choose a first frame and a last frame.");
      return;
    }
    if (veoFirst.url === veoLast.url) {
      alert("First and last frame must be different.");
      return;
    }

    try {
      setVeoLoading(true);
      setStatus("Generating two-shot 8s transition…");

      const body = {
        firstFrameUrl: veoFirst.url,
        lastFrameUrl: veoLast.url,
        firstPrompt: veoFirst.prompt,
        lastPrompt: veoLast.prompt,
        moodAnswer,
        vibeInput,
      };

      const res = await fetch("/api/veo-first-last", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Failed to generate Veo video");
      }

      const data = (await res.json()) as { videoUrl: string };
      setVeoVideoUrl(data.videoUrl);
      setStatus("Two-shot Veo loop ready. Preview or download below.");
    } catch (err) {
      console.error(err);
      setStatus("Error generating two-shot video. Check console.");
    } finally {
      setVeoLoading(false);
    }
  }

  const canRerunConcepts = !!recipe && retryCount < 1;

  return (
    <main className="min-h-screen bg-background text-foreground font-sans p-6 flex gap-6">
      {/* LEFT SIDEBAR */}
      <section className="w-[340px] flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">AI Canvas Director (MVP)</h1>
        <p className="text-sm text-muted-foreground">
          Upload a track, get AI analysis, three–six visual concepts, then
          generate a 5–8s canvas-ready video.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">1. Upload track</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:text-secondary-foreground"
          />
        </label>

        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            className="w-full mt-1 rounded-md border border-input"
          />
        )}

        <div>
          <h2 className="text-sm font-medium mb-1">2. Style mode</h2>
          <select
            value={styleMode}
            onChange={(e) => setStyleMode(e.target.value as StyleMode)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="auto">Let AI choose based on track</option>
            <option value="manual">Use preset selected below</option>
          </select>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-1">2a. Style preset</h2>
          <select
            value={chosenStyle}
            onChange={(e) => setChosenStyle(e.target.value as VisualStyleId)}
            disabled={styleMode === "auto"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {VISUAL_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="mt-2 mb-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={abstractOnly}
                onChange={(e) => setAbstractOnly(e.target.checked)}
                className="h-3 w-3 rounded border border-input bg-background"
              />
              Prefer abstract / no people
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Disabled if AI is choosing style automatically.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-1">2b. Output type</h2>
          <select
            value={shotMode}
            onChange={(e) => setShotMode(e.target.value as ShotMode)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="single">Single shot – 5s loop</option>
            <option value="double">
              Two shots – ~8s transition (first → last)
            </option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            One price, either a single 5s canvas or an 8s two-shot transition.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-1">
            2c. Extra vibe tags (optional)
          </h2>
          <input
            value={vibeInput}
            onChange={(e) => setVibeInput(e.target.value)}
            placeholder="sad, legato, cinematic"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-1">
            2d. Color / palette (optional)
          </h2>
          <input
            value={colorOverride}
            onChange={(e) => setColorOverride(e.target.value)}
            placeholder="lavender haze, warm gold, teal glow"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-1">
            2e. (Optional) Describe the vibe
          </h2>
          <textarea
            value={moodAnswer}
            onChange={(e) => setMoodAnswer(e.target.value)}
            placeholder="dark neon highway, rain, slow camera moves…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="mt-1 inline-flex items-center justify-center rounded-full border border-transparent bg-success-light px-4 py-2 text-sm font-semibold text-success-foreground shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing…" : "Analyze track & craft concepts"}
        </button>

        <div className="text-xs text-muted-foreground">{status}</div>
      </section>

      {/* MAIN CONTENT */}
      <section className="flex-1 grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] gap-6">
        {/* MIDDLE: concepts + output video */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">
            Step 3 — Choose visual &amp; generate
          </h2>

          {/* Concepts row */}
          {imageIdeas.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3">
                {imageIdeas.map((idea, idx) => {
                  const isSelected = selectedImage?.url === idea.url;
                  const isFirst = veoFirst?.url === idea.url;
                  const isLast = veoLast?.url === idea.url;

                  return (
                    <div
                      key={idx}
                      className={[
                        "relative rounded-2xl overflow-hidden border bg-background/40",
                        isSelected ? "border-success-light" : "border-border",
                      ].join(" ")}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedImage(idea)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedImage(idea);
                          }
                        }}
                        className="cursor-pointer outline-none"
                      >
                        <img
                          src={idea.url}
                          alt={`Concept ${idx + 1}`}
                          className="block w-[140px] h-[210px] object-cover"
                        />
                      </div>

                      {shotMode === "double" && (
                        <div className="absolute bottom-1 left-1 flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVeoFirst(idea);
                            }}
                            className={[
                              "px-2 py-0.5 rounded-full border-0 text-[0.7rem]",
                              isFirst
                                ? "bg-success-light text-success-foreground"
                                : "bg-black/60 text-foreground",
                            ].join(" ")}
                          >
                            1st
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVeoLast(idea);
                            }}
                            className={[
                              "px-2 py-0.5 rounded-full border-0 text-[0.7rem]",
                              isLast
                                ? "bg-[#ff7890] text-black"
                                : "bg-black/60 text-foreground",
                            ].join(" ")}
                          >
                            2nd
                          </button>
                        </div>
                      )}

                      {(isFirst || isLast) && (
                        <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-black/80 text-foreground">
                          {isFirst && isLast
                            ? "1st & 2nd"
                            : isFirst
                            ? "1st"
                            : "2nd"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Re-run concepts (once) */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!recipe || !canRerunConcepts) return;
                    await generateImageIdeas(recipe, true);
                  }}
                  disabled={!canRerunConcepts}
                  className={[
                    "inline-flex items-center rounded-md border px-3 py-1 text-xs",
                    canRerunConcepts
                      ? "border-border bg-background/40 hover:bg-background/70 cursor-pointer"
                      : "border-border bg-muted cursor-not-allowed opacity-60",
                  ].join(" ")}
                >
                  {retryCount >= 1
                    ? "Concepts re-run used"
                    : "Re-run concepts once"}
                </button>
                <span className="text-[0.75rem] text-muted-foreground">
                  Uses same settings; update color / abstract toggle first if you
                  like.
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              After analysis, you&apos;ll see three visual concepts here
              (single-shot) or six (two-shot).
            </p>
          )}

          {/* WAN / Veo controls */}
          {imageIdeas.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 items-start">
              <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>Camera motion (for single-shot WAN)</span>
                <select
                  value={cameraMotion}
                  onChange={(e) =>
                    setCameraMotion(e.target.value as CameraMotion)
                  }
                  className="w-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="zoom-in">Slow zoom in</option>
                  <option value="zoom-out">Slow zoom out</option>
                  <option value="circle-pan">Circle pan</option>
                  <option value="swirl">Subtle swirl</option>
                  <option value="static">Almost static</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGenerateWanVideo}
                  disabled={
                    !selectedImage || !file || wanLoading || shotMode !== "single"
                  }
                  className={[
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold",
                    !selectedImage ||
                    !file ||
                    wanLoading ||
                    shotMode !== "single"
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-[#5096ff] text-white hover:opacity-90",
                  ].join(" ")}
                >
                  {wanLoading
                    ? "Generating 5s WAN loop…"
                    : "Generate 5s single-shot loop"}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateVeoVideo}
                  disabled={
                    imageIdeas.length < 1 || veoLoading || shotMode !== "double"
                  }
                  className={[
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold",
                    imageIdeas.length < 1 || veoLoading || shotMode !== "double"
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-[#ff7890] text-white hover:opacity-90",
                  ].join(" ")}
                >
                  {veoLoading
                    ? "Generating 8s Veo transition…"
                    : "Generate 8s two-shot loop"}
                </button>
              </div>
            </div>
          )}

          {/* Output videos */}
          {(wanVideoUrl || veoVideoUrl) && (
            <div className="mt-4 flex flex-col gap-4 w-full">
              {wanVideoUrl && (
                <div className="flex flex-col gap-1 text-xs">
                  <span>Single-shot 5s loop (WAN):</span>
                  <video
                    src={wanVideoUrl}
                    controls
                    className="w-full max-h-[260px] rounded-xl border border-border"
                  />
                  <a
                    href={wanVideoUrl}
                    download="wan-loop.mp4"
                    className="text-[0.8rem] text-success-light underline underline-offset-4"
                  >
                    Download 5s loop (.mp4)
                  </a>
                </div>
              )}

              {veoVideoUrl && (
                <div className="flex flex-col gap-1 text-xs">
                  <span>Two-shot ~8s transition (Veo):</span>
                  <video
                    src={veoVideoUrl}
                    controls
                    className="w-full max-h-[260px] rounded-xl border border-border"
                  />
                  <a
                    href={veoVideoUrl}
                    download="veo-loop.mp4"
                    className="text-[0.8rem] text-success-light underline underline-offset-4"
                  >
                    Download 8s loop (.mp4)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: analysis */}
        <div className="p-4 rounded-2xl border border-border bg-card/90 overflow-y-auto max-h-[80vh]">
          <h2 className="text-sm font-medium mb-2">Track analysis</h2>
          {!recipe && (
            <p className="text-sm text-muted-foreground">
              After analysis, you&apos;ll see genre, mood tags and visual notes
              for the track.
            </p>
          )}

          {recipe && (
            <>
              <div className="mb-3">
                <div className="text-xs text-muted-foreground">
                  Style preset
                </div>
                <div className="font-semibold text-sm">
                  {
                    VISUAL_STYLES.find((s) => s.id === recipe.chosenStyle)
                      ?.label
                  }
                </div>
                <div className="text-xs text-muted-foreground">
                  {
                    VISUAL_STYLES.find((s) => s.id === recipe.chosenStyle)
                      ?.description
                  }
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Mode:{" "}
                  {recipe.styleMode === "auto"
                    ? "AI-selected based on track"
                    : "Manual preset"}
                </div>
              </div>

              {recipe.vibeTags && recipe.vibeTags.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground">
                    Extra vibe tags
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {recipe.vibeTags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[0.7rem]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <div className="text-xs text-muted-foreground">
                  Genre &amp; energy
                </div>
                <div className="text-sm">
                  <strong>Genre:</strong> {recipe.gemini.genre}
                </div>
                <div className="text-sm">
                  <strong>Energy:</strong> {recipe.gemini.energyLevel}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-muted-foreground">Mood tags</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {recipe.gemini.moodTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[0.7rem]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-muted-foreground">Summary</div>
                <p className="mt-1 text-sm">{recipe.gemini.summary}</p>
              </div>

              <div className="mb-3">
                <div className="text-xs text-muted-foreground">
                  Visual hints
                </div>
                <ul className="mt-1 list-disc pl-4 text-sm space-y-1">
                  {recipe.gemini.visualHints.map(
                    (hint: string, idx: number) => (
                      <li key={idx}>{hint}</li>
                    )
                  )}
                </ul>
              </div>

              {recipe.moodAnswer && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground">
                    Artist-provided vibe
                  </div>
                  <p className="mt-1 text-sm">{recipe.moodAnswer}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
