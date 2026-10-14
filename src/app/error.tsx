"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="dots grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-md rounded-2xl border border-mist bg-surface p-8 shadow-soft">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose/10 text-rose">
          ⚠️
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Something went wrong</h2>
        <p className="mt-2 text-xs text-ink-soft leading-relaxed">
          An unexpected error occurred while loading this section. Please try reloading or head back to the dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()} className="text-xs">
            Reload Page
          </Button>
          <Button onClick={() => reset()} className="text-xs">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
