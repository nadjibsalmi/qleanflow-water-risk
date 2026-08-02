"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RegionSummary } from "@/services/waterQualityData";

export function RegionContaminationChart({ data }: { data: RegionSummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="var(--surface-border)"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={{ stroke: "var(--surface-border)" }}
          tickLine={false}
        />
        <YAxis
          dataKey="region"
          type="category"
          width={110}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [
            typeof value === "number" ? value.toFixed(2) : String(value),
            "Avg. contamination",
          ]}
        />
        <Bar dataKey="avgContamination" fill="var(--accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
