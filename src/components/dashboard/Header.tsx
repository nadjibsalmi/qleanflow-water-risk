"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { MobileNav } from "./MobileNav";

/**
 * Both theme icons render in the server and client DOM. CSS selects the
 * visible icon from the `.dark` class that the pre-hydration theme script
 * applies to `<html>`, avoiding a hydration mismatch and a flash of the
 * wrong icon. State remains responsible for the toggle direction and
 * accessible label.
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
        {/* Both icons render so CSS can select one from the current theme
            class without changing the server-rendered DOM during hydration. */}
        <Sun className="w-4 h-4 hidden dark:block" strokeWidth={2} />
        <Moon className="w-4 h-4 block dark:hidden" strokeWidth={2} />
      </button>
    </header>
  );
}
