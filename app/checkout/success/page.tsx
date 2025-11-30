// app/checkout/success/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

export default function CheckoutSuccess() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");

  useEffect(() => {
    if (email) {
      Cookies.set("vpm_email", email, { expires: 30 });
      router.push("/canvas-director");
    } else {
      router.push("/checkout");
    }
  }, [email, router]);

  return (
    <main className="flex items-center justify-center min-h-screen text-sm">
      <p>Processing your access… redirecting.</p>
    </main>
  );
}
