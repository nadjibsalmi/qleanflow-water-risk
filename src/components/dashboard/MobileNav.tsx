"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Droplets } from "lucide-react";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "./navItems";

/**
 * BEFORE: the Sidebar component used `hidden lg:flex`, meaning below the
 * lg breakpoint (most phones and small tablets) the entire navigation
 * simply disappeared with no replacement - there was no way to move
 * between pages at all on mobile. This is a real, significant responsive
 * gap, not a cosmetic one.
 *
 * AFTER: a hamburger button (visible only below lg) opens a slide-over
 * drawer with the same navigation, keyboard-dismissible (Escape) and
 * dismissible by tapping the backdrop.
 *
 * A later audit found this drawer, while functional, wasn't actually a
 * proper accessible dialog: no role="dialog"/aria-modal, no focus trap
 * (Tab could escape to the page behind the backdrop), no body scroll
 * lock, and focus was never returned to the trigger button on close.
 * All four are fixed below.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open, and move focus into it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Return focus to the button that opened the drawer - standard
    // expected behavior for any dialog/modal on close.
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }

      // Basic focus trap: keep Tab/Shift+Tab cycling within the drawer's
      // focusable elements instead of escaping to the page behind it.
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="lg:hidden p-2 -ml-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Close navigation menu"
            onClick={close}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 w-72 bg-background border-r border-surface-border flex flex-col animate-slide-in-left"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-accent" strokeWidth={2.5} />
                <span className="font-semibold tracking-tight">QleanFlow</span>
              </div>
              <button
                ref={closeButtonRef}
                onClick={close}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:text-foreground hover:bg-surface"
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
