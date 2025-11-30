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
      // ✅ Store user email for access check in middleware
      Cookies.set("vpm_email", email, { expires: 30 });
      router.push("/canvas-director");
    } else {
      router.push("/checkout");
    }
  }, [email, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-lg text-center">Redirecting you to Canvas Director...</p>
    </div>
  );
}
