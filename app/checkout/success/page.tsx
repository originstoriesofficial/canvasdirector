"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function SuccessInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    async function verifyAndRedirect() {
      const email = searchParams.get("email");
      if (!email) return;

      try {
        const res = await fetch("/api/verify-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.ok) {
          // ✅ Set access cookie
          document.cookie = `vpm_email=${email}; path=/; max-age=2592000`;
          window.location.href = "/canvas-director";
        } else {
          console.error("Verification failed:", data);
        }
      } catch (err) {
        console.error("Verify error:", err);
      }
    }

    verifyAndRedirect();
  }, [searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-2xl font-semibold">Verifying your purchase…</h1>
      <p className="text-sm text-muted-foreground">
        Please wait while we confirm your access.
      </p>
    </main>
  );
}

export default function SuccessPage() {
  // ✅ Wrap useSearchParams() in <Suspense> to avoid the Next.js build error
  return (
    <Suspense fallback={<p className="text-center mt-8">Loading...</p>}>
      <SuccessInner />
    </Suspense>
  );
}
