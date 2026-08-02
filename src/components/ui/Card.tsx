import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Card({
  title,
  subtitle,
  children,
  className,
  headingClassName,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-border bg-surface/40 p-5",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          {/* BEFORE: h3, with no h2 anywhere on the page - skips a heading
              level (page title is h1 in Header), a real WCAG 1.3.1 gap
              since screen reader users navigating by heading level would
              jump straight from h1 to h3. */}
          <h2 className={cn("text-sm font-semibold", headingClassName)}>{title}</h2>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
