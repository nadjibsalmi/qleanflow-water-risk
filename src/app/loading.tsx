export default function Loading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-accent-soft" />
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-border" />
            <div className="h-2.5 w-44 animate-pulse rounded bg-surface-border/70" />
          </div>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface/40 p-5">
          <div className="mb-5 h-4 w-36 animate-pulse rounded bg-surface-border" />
          <div className="space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-surface-border/70" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-surface-border/70" />
            <div className="h-32 w-full animate-pulse rounded-lg bg-surface-border/50" />
          </div>
        </div>
        <p className="text-center text-xs text-muted">Loading water-risk intelligence…</p>
      </div>
    </main>
  );
}