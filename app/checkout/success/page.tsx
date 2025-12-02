"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

export default function CheckoutSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");

  useEffect(() => {
    const verify = async () => {
      if (!email) {
        router.push("/checkout");
        return;
      }

      const res = await fetch("/api/verify-lemon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.ok) {
        Cookies.set("vpm_email", email, { expires: 30 });
        router.push("/canvas-director");
      } else {
        router.push("/checkout");
      }
    };

    verify();
  }, [email, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-lg text-center">Verifying your purchase...</p>
    </div>
  );
}
