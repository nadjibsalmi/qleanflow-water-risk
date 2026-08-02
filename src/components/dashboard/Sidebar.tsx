"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets } from "lucide-react";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "./navItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-surface-border bg-surface/50">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-surface-border">
        <Droplets className="w-5 h-5 text-accent" strokeWidth={2.5} />
        <span className="font-semibold tracking-tight">QleanFlow</span>
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

      <div className="px-6 py-4 border-t border-surface-border">
        <p className="text-xs text-muted leading-relaxed">
          Quantum-enhanced risk assessment for water contamination in mining-affected
          regions of Ghana.
        </p>
      </div>
    </aside>
  );
}
