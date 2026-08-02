import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  hint?: string;
}

const TONE_STYLES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-accent bg-accent-soft",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/40 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted font-medium">{label}</span>
        <div className={cn("p-1.5 rounded-lg", TONE_STYLES[tone])}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      </div>
    </div>
  );
}
