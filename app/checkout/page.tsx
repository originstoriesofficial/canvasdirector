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
        const res = await fetch("/api/verify-lemon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data.ok) {
          // ✅ Set cookie for entire .vpm.studio domain
          const cookieValue = `vpm_email=${email.toLowerCase()}; path=/; domain=.vpm.studio; max-age=2592000; secure; samesite=strict`;
          document.cookie = cookieValue;

          // ✅ Redirect to canvas-director
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
  return (
    <Suspense fallback={<p className="text-center mt-8">Loading...</p>}>
      <SuccessInner />
    </Suspense>
  );
}
