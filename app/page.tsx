"use client";

import { useState, useEffect } from "react";

export default function LandingPage() {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const access = document.cookie.includes("canvas_access=true");
    setHasAccess(access);
  }, []);

  const handlePurchase = () => {
    const checkoutUrl =
      "https://vpm.lemonsqueezy.com/buy/5bce3180-ceec-4ff6-9ed3-5f7ebafa1077";

    try {
      // @ts-ignore — injected by lemon.js
      const lemon = window.LemonSqueezy as {
        Open?: (url: string) => void;
      };

      if (lemon && typeof lemon.Open === "function") {
        lemon.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, "_blank");
      }
    } catch (err) {
      console.error("LemonSqueezy checkout error:", err);
      window.open(checkoutUrl, "_blank");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 py-12 text-center space-y-8">
      {/* 🎥 Three vertical demo videos */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="overflow-hidden rounded-lg shadow-lg bg-black hover:scale-[1.02] transition-transform duration-300"
          >
            <video
              className="h-[400px] w-[225px] object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={`/video${n}.mp4`} type="video/mp4" />
            </video>
          </div>
        ))}
      </div>

      {/* 🧠 Headline + description */}
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold">
          VPM Studio – Canvas Director
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Upload a track, and we’ll generate dynamic, one-of-a-kind vertical
          visuals tuned to your song.
        </p>
      </div>

      {/* 💳 Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!hasAccess ? (
          <button
            onClick={handlePurchase}
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Get Access –{" "}
            <span className="line-through text-gray-300">$39.99</span>{" "}
            <span className="text-yellow-300">$19.99</span>
          </button>
        ) : (
          <a
            href="/canvas-director"
            className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Enter Canvas Director
          </a>
        )}
      </div>

      {/* 📝 Subtext */}
      <p className="text-xs text-muted-foreground">
        {hasAccess
          ? "Access unlocked for this browser session."
          : "Buy once to unlock 2 custom-made visual loops – no login required."}
      </p>

      {/* ❓ FAQ */}
      <section className="max-w-2xl mt-12 text-left space-y-6">
        <h2 className="text-lg font-semibold">FAQ</h2>

        <div>
          <p className="font-medium">Who creates the visuals?</p>
          <p className="text-sm text-muted-foreground">
            Our team of experienced motion designers collaborate with AI systems
            to generate dynamic, one-of-a-kind visual loops tailored to your
            music.
          </p>
        </div>

        <div>
          <p className="font-medium">How many loops are included?</p>
          <p className="text-sm text-muted-foreground">
            You’ll receive 2 custom vertical loops, each 5–8 seconds long, ready
            to share on Spotify Canvas, TikTok, or Instagram Reels.
          </p>
        </div>

        <div>
          <p className="font-medium">Do I keep the rights?</p>
          <p className="text-sm text-muted-foreground">
            Yes — all loops are licensed for personal and commercial social
            media use.
          </p>
        </div>
      </section>

      {/* ⚖️ Footer */}
      <footer className="mt-16 text-xs text-muted-foreground space-x-3">
        <a
          href="https://docs.google.com/document/d/1-U0Yz3N3FfCmfJH7_iTjsB_qEQbmvxRSxvIqd_kjAKs/edit?tab=t.0"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Privacy Policy & GDPR
        </a>
        <span>•</span>
        <span>© {new Date().getFullYear()} VPM Studio</span>
      </footer>
    </main>
  );
}
