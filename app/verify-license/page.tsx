"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyLicensePage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");

  async function handleVerify() {
    setStatus("Verifying...");

    try {
      const res = await fetch("/api/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("✅ License verified! Redirecting...");
        setTimeout(() => router.push("/canvas-director"), 1000);
      } else {
        setStatus("❌ Invalid license key. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Server error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-3xl font-semibold">Enter Your License Key</h1>
      <p className="text-gray-500">
        You can find it in your Lemon Squeezy email receipt.
      </p>

      <input
        type="text"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="XXXX-XXXX-XXXX"
        className="border rounded-md px-4 py-2 w-64 text-center focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={handleVerify}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:opacity-90"
      >
        Verify License
      </button>

      <p className="text-sm text-gray-600">{status}</p>
    </main>
  );
}
