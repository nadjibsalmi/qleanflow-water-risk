"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the error available to Next.js' runtime diagnostics without
    // exposing implementation details in the user-facing screen.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-lg text-center" title="The dashboard hit a snag">
        <p className="text-sm leading-relaxed text-muted">
          QleanFlow could not finish loading this view. Your data is safe; try the request
          again or return to the overview.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to overview
          </Link>
        </div>
      </Card>
    </main>
  );
}
