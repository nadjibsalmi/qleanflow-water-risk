"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { CommunityRecord } from "@/services/waterQualityData";

interface CommunityMapProps {
  records: CommunityRecord[];
}

/**
 * A geographic scatter plot of all 500 real communities, positioned by
 * their actual latitude/longitude, colored by contamination level, and
 * sized by population. This is a real, lightweight alternative to an
 * external tile-based map (Leaflet/Mapbox): it needs no map tile server,
 * no API key, and works fully offline - appropriate here since the goal
 * is showing the real geographic spread and risk pattern, not street-level
 * detail.
 */
function mapSummary(records: CommunityRecord[]): string {
  const miningCount = records.filter((r) => r.isMiningZone).length;
  const highContaminationCount = records.filter((r) => r.contaminationLevel >= 5).length;
  return (
    `Geographic scatter plot of ${records.length} communities across Ghana. ` +
    `${miningCount} are in active mining zones (shown in red). ` +
    `${highContaminationCount} have high contamination levels (5 or above).`
  );
}

export function CommunityMap({ records }: CommunityMapProps) {
  const points = records.map((r) => ({
    x: r.longitude,
    y: r.latitude,
    z: r.population,
    community: r.community,
    region: r.region,
    contamination: r.contaminationLevel,
    isMiningZone: r.isMiningZone,
  }));

  function colorFor(contamination: number, isMiningZone: boolean) {
    if (isMiningZone) return "#dc2626"; // danger - mining zone communities flagged distinctly
    if (contamination >= 5) return "#d97706"; // warning
    if (contamination >= 3) return "#4f46e5"; // accent
    return "#16a34a"; // success
  }

  return (
    <div className="h-[420px]" role="img" aria-label={mapSummary(records)}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="var(--surface-border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Longitude"
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            stroke="var(--surface-border)"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Latitude"
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            stroke="var(--surface-border)"
          />
          <ZAxis type="number" dataKey="z" range={[20, 200]} name="Population" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof points)[number];
              return (
                <div className="rounded-lg border border-surface-border bg-background px-3 py-2 shadow-lg text-xs space-y-0.5">
                  <p className="font-semibold">{p.community}</p>
                  <p className="text-muted">{p.region}</p>
                  <p>Contamination: {p.contamination.toFixed(2)}</p>
                  <p>Population: {p.z.toLocaleString()}</p>
                  {p.isMiningZone && (
                    <p className="text-danger font-medium">Mining zone</p>
                  )}
                </div>
              );
            }}
          />
          <Scatter data={points}>
            {points.map((p) => (
              <Cell
                key={p.community}
                fill={colorFor(p.contamination, p.isMiningZone)}
                fillOpacity={0.65}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted">
        <LegendDot color="#16a34a" label="Low contamination" />
        <LegendDot color="#4f46e5" label="Moderate" />
        <LegendDot color="#d97706" label="High" />
        <LegendDot color="#dc2626" label="Mining zone" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
