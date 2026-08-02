"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

/**
 * A qualitative color ramp for up to 9 pie slices - these are deliberately
 * NOT semantic design tokens (this chart has no notion of "danger" or
 * "success" per category), so a static hardcoded palette is the right
 * choice here.
 *
 * BEFORE: the first color was #6366f1 - the project's OLD accent color,
 * before it was replaced with #4f46e5 in globals.css for WCAG AA contrast
 * compliance (4.47:1, failing the 4.5:1 threshold -> 6.29:1). That fix
 * never propagated to this hardcoded duplicate. Now anchored to the
 * current accent (#4f46e5) with the rest of the ramp built consistently
 * around it.
 */
const COLORS = [
  "#4f46e5", // accent (indigo-600, matches globals.css --accent)
  "#818cf8",
  "#a5b4fc",
  "#6d28d9",
  "#312e81",
  "#c7d2fe",
  "#3730a3",
  "#e0e7ff",
  "#1e1b4b",
];

export function ContaminationTypeChart({
  data,
}: {
  data: { type: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
