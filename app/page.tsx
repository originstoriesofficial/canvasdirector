// app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-semibold">
          VPM Studio – AI Canvas Director
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Upload a track, let AI analyze it, and generate 5–8s vertical canvas
          visuals tuned to your song.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Link
            href="/canvas-director"
            className="inline-flex items-center justify-center rounded-full bg-success-light px-6 py-2 text-sm font-semibold text-success-foreground hover:opacity-90"
          >
            Enter Canvas Director
          </Link>
        </div>

        <p className="text-[0.75rem] text-muted-foreground mt-3">
          No login yet. Upload a track and try the studio.
        </p>
      </div>
    </main>
  );
}
