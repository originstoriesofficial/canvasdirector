"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function verifyAndRedirect() {
      const email = searchParams.get("email");
      if (!email) {
        router.push("/checkout");
        return;
      }

      try {
        // ✅ Verify purchase via Lemon API + Redis
        const res = await fetch("/api/verify-lemon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.ok) {
          // ✅ Store email cookie (used by middleware)
          document.cookie = `vpm_email=${email}; path=/; max-age=2592000`; // 30 days
          // ✅ Redirect to Canvas Director
          router.push("/canvas-director");
        } else {
          console.error("Verification failed:", data);
          router.push("/checkout");
        }
      } catch (err) {
        console.error("Verify error:", err);
        router.push("/checkout");
      }
    }

    verifyAndRedirect();
  }, [searchParams, router]);

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
  // ✅ Wrap useSearchParams() to avoid build-time SSR error
  return (
    <Suspense fallback={<p className="text-center mt-8">Loading...</p>}>
      <SuccessInner />
    </Suspense>
  );
}
