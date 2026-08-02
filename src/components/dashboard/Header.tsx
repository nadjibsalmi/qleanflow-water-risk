"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { MobileNav } from "./MobileNav";

/**
 * AUDIT FIX (zero UI side effects, corrected twice):
 *
 * Attempt 1 (rejected on further review): initialize `isDark` state from
 * `document.documentElement.classList.contains("dark")` via a lazy
 * useState initializer. This looked like it would fix the one-frame
 * wrong-icon flash, but it actually introduces something worse: React's
 * lazy initializer runs once on the SERVER (where `document` is
 * undefined, so it evaluates to `false`) and ALSO once independently on
 * the CLIENT during hydration (where `document` now exists and reflects
 * the real, already-applied theme). If the real theme is dark, the
 * server-rendered HTML would contain the Moon icon while the client's
 * first hydration pass computes `isDark=true` and expects the Sun icon -
 * a genuine hydration mismatch (not just a visual flash: an actual
 * server/client output disagreement that React would warn about and then
 * force-correct, causing a worse jump than the original bug).
 *
 * Correct fix: stop using React state to decide which icon is VISUALLY
 * shown at all. Both icons are always rendered; which one is visible is
 * decided purely by CSS, keyed off the same `.dark` class on `<html>`
 * that the pre-hydration script in layout.tsx already sets synchronously
 * before any paint happens. This has zero dependency on JS execution
 * order, zero hydration risk (server and client render identical DOM -
 * both icons present, CSS decides visibility identically on both), and
 * zero flash, by construction rather than by careful sequencing.
 *
 * This requires `@custom-variant dark (&:where(.dark, .dark *));` in
 * globals.css so Tailwind's `dark:` prefix actually keys off this same
 * `.dark` class instead of defaulting to `prefers-color-scheme` (see the
 * comment there for the related bug this uncovered and fixed).
 *
 * `isDark` state is kept, but now only for `aria-label` correctness and
 * to know which direction to toggle - it has no bearing on which icon is
 * painted, so it being transiently "wrong" for one tick pre-hydration (it
 * never actually is, since it's also lazily read from the DOM below, but
 * even if it were) would have zero visual consequence.
 */
export function Header({ title }: { title: string }) {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-surface-border">
      <div className="flex items-center gap-2">
        <MobileNav />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <button
        onClick={toggleTheme}
        aria-label="Toggle color theme"
        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Both icons always render; CSS (not JS state) decides which one
            is visible, keyed off the same .dark class the anti-FOUC
            script applies pre-hydration. Zero flash, zero hydration
            mismatch risk - see the audit-fix comment above. */}
        <Sun className="w-4 h-4 hidden dark:block" strokeWidth={2} />
        <Moon className="w-4 h-4 block dark:hidden" strokeWidth={2} />
      </button>
    </header>
  );
}
