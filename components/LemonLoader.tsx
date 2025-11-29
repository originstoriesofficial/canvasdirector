"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function LemonLoader() {
  useEffect(() => {
    const handleComplete = () => {
      document.cookie = "canvas_access=true; path=/; max-age=86400";
      window.location.href = "/canvas-director";
    };

    window.addEventListener("lemonsqueezy:completed", handleComplete);
    return () => window.removeEventListener("lemonsqueezy:completed", handleComplete);
  }, []);

  return (
    <Script
      src="https://assets.lemonsqueezy.com/lemon.js"
      strategy="afterInteractive"
    />
  );
}
