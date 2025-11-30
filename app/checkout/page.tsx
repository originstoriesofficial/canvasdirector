// app/checkout/page.tsx
"use client";

export default function CheckoutPage() {
  const handlePurchase = () => {
    const checkoutUrl =
      "https://vpm.lemonsqueezy.com/buy/5bce3180-ceec-4ff6-9ed3-5f7ebafa1077";
    window.open(checkoutUrl, "_blank");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Get Access to Canvas Director</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Purchase one-time access to generate up to <strong>2 AI loops</strong>.
      </p>
      <button
        onClick={handlePurchase}
        className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
      >
        Get Access
      </button>
    </main>
  );
}
