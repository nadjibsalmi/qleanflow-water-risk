import { readFile } from "fs/promises";
import path from "path";
import Papa from "papaparse";

/**
 * Data access layer for the bundled Ghana water-quality proof-of-concept CSV.
 *
 * This is intentionally a plain Node file-read + parse, not a mocked API
 * response - every number the dashboard renders traces back to
 * `data/ghana_water_quality_data.csv`. This module does not generate or
 * randomize values at runtime; the CSV's external provenance is documented
 * separately and is not verified by this repository.
 */

export interface CommunityRecord {
  community: string;
  region: string;
  latitude: number;
  longitude: number;
  waterQuality: 0 | 1; // 1 = good
  distanceToRiverKm: number;
  isMiningZone: boolean;
  contaminationLevel: number;
  contaminationType: string;
  waterSource: string;
  waterAccessScore: number;
  numberOfChildren: number;
  population: number;
  avgDailyWaterNeedsLiters: number;
  diseasePrevalence: number;
  accessibility: string;
  urbanRural: string;
  sanitationFacilities: string;
  avgHouseholdIncomeGHS: number;
  educationLevelYears: number;
  governmentIntervention: boolean;
  ngoPresence: boolean;
  yearCollected: number;
}

type RawRow = Record<string, string>;

function toBool(v: string): boolean {
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

/**
 * Numeric CSV values are normalized at ingestion so every downstream
 * consumer can rely on `CommunityRecord` never containing `NaN`. Malformed
 * values produce a warning and use the safe fallback `0`.
 */
export function safeNumber(
  raw: string,
  parser: (v: string) => number,
  fieldName: string,
  communityName: string
): number {
  const value = parser(raw);
  if (Number.isNaN(value)) {
    console.warn(
      `Malformed numeric value for "${fieldName}" in community "${communityName || "(unknown)"}" ` +
        `(raw value: ${JSON.stringify(raw)}) - substituting 0 to prevent NaN from propagating ` +
        `into downstream aggregates.`
    );
    return 0;
  }
  return value;
}

export function mapRow(row: RawRow): CommunityRecord {
  const community = row["Community"];

  return {
    community,
    region: row["Region"],
    latitude: safeNumber(row["Latitude"], parseFloat, "latitude", community),
    longitude: safeNumber(row["Longitude"], parseFloat, "longitude", community),
    waterQuality: (row["Water Quality"] === "1" ? 1 : 0) as 0 | 1,
    distanceToRiverKm: safeNumber(
      row["Distance to Nearest River (km)"],
      parseFloat,
      "distanceToRiverKm",
      community
    ),
    isMiningZone: toBool(row["Is Mining Zone"]),
    contaminationLevel: safeNumber(
      row["Contamination Level"],
      parseFloat,
      "contaminationLevel",
      community
    ),
    contaminationType: row["Contamination Type"],
    waterSource: row["Water Source"],
    waterAccessScore: safeNumber(
      row["Water Access Score"],
      parseFloat,
      "waterAccessScore",
      community
    ),
    numberOfChildren: safeNumber(
      row["Number of Children"],
      (v) => parseInt(v, 10),
      "numberOfChildren",
      community
    ),
    population: safeNumber(
      row["Population"],
      (v) => parseInt(v, 10),
      "population",
      community
    ),
    avgDailyWaterNeedsLiters: safeNumber(
      row["Average Daily Water Needs (liters)"],
      parseFloat,
      "avgDailyWaterNeedsLiters",
      community
    ),
    diseasePrevalence: safeNumber(
      row["Prevalence of Water Borne Diseases"],
      parseFloat,
      "diseasePrevalence",
      community
    ),
    accessibility: row["Accessibility"],
    urbanRural: row["Urban/Rural"],
    sanitationFacilities: row["Sanitation Facilities Available"],
    avgHouseholdIncomeGHS: safeNumber(
      row["Average Household Income (GHS)"],
      parseFloat,
      "avgHouseholdIncomeGHS",
      community
    ),
    educationLevelYears: safeNumber(
      row["Education Level (Avg Years)"],
      parseFloat,
      "educationLevelYears",
      community
    ),
    governmentIntervention: toBool(row["Government Intervention Present"]),
    ngoPresence: toBool(row["NGO Presence"]),
    yearCollected: safeNumber(
      row["Year Data Collected"],
      (v) => parseInt(v, 10),
      "yearCollected",
      community
    ),
  };
}

let cachedRecordsPromise: Promise<CommunityRecord[]> | null = null;

/**
 * Cache the in-flight read and parse operation so concurrent callers await
 * one shared CSV load instead of repeating the disk read and parsing work.
 */
export async function getAllRecords(): Promise<CommunityRecord[]> {
  if (!cachedRecordsPromise) {
    cachedRecordsPromise = (async () => {
      const csvPath = path.join(process.cwd(), "data", "ghana_water_quality_data.csv");
      const raw = await readFile(csvPath, "utf-8");

      const parsed = Papa.parse<RawRow>(raw, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        // Real parsing errors (malformed rows, mismatched column count,
        // etc.) were previously silently ignored - Papa.parse still
        // returns whatever rows it *could* parse, so this failed
        // silently rather than surfacing a clear error.
        console.error(
          `CSV parsing encountered ${parsed.errors.length} error(s):`,
          parsed.errors.slice(0, 5)
        );
      }

      return parsed.data.map(mapRow);
    })();
  }

  return cachedRecordsPromise;
}

/**
 * Calculate a rounded percentage for records matching a predicate. Keeping
 * the empty-list behavior and rounding in one helper keeps all summaries
 * consistent.
 */
function percentageMatching<T>(list: T[], predicate: (item: T) => boolean): number {
  if (list.length === 0) return 0;
  return round((list.filter(predicate).length / list.length) * 100, 1);
}

function average(list: number[]): number {
  if (list.length === 0) return 0;
  return list.reduce((sum, v) => sum + v, 0) / list.length;
}

export interface RegionSummary {
  region: string;
  totalCommunities: number;
  avgContamination: number;
  goodQualityPct: number;
  miningZonePct: number;
}

export async function getRegionSummaries(): Promise<RegionSummary[]> {
  const records = await getAllRecords();
  const byRegion = new Map<string, CommunityRecord[]>();

  for (const r of records) {
    const list = byRegion.get(r.region) ?? [];
    list.push(r);
    byRegion.set(r.region, list);
  }

  return Array.from(byRegion.entries())
    .map(([region, list]) => ({
      region,
      totalCommunities: list.length,
      avgContamination: round(average(list.map((r) => r.contaminationLevel)), 3),
      goodQualityPct: percentageMatching(list, (r) => r.waterQuality === 1),
      miningZonePct: percentageMatching(list, (r) => r.isMiningZone),
    }))
    .sort((a, b) => b.avgContamination - a.avgContamination);
}

export interface OverallStats {
  totalCommunities: number;
  totalPopulation: number;
  goodQualityPct: number;
  miningZonePct: number;
  avgDiseasePrevalence: number;
  avgWaterAccessScore: number;
  governmentInterventionPct: number;
  ngoPresencePct: number;
}

export async function getOverallStats(): Promise<OverallStats> {
  const records = await getAllRecords();

  return {
    totalCommunities: records.length,
    // No `|| 0` guard needed here anymore: safeNumber() at ingestion
    // already guarantees `population` (and every other numeric field)
    // is never NaN, so this sum can never silently become NaN either.
    totalPopulation: records.reduce((s, r) => s + r.population, 0),
    goodQualityPct: percentageMatching(records, (r) => r.waterQuality === 1),
    miningZonePct: percentageMatching(records, (r) => r.isMiningZone),
    avgDiseasePrevalence: round(average(records.map((r) => r.diseasePrevalence)), 3),
    avgWaterAccessScore: round(average(records.map((r) => r.waterAccessScore)), 2),
    governmentInterventionPct: percentageMatching(
      records,
      (r) => r.governmentIntervention
    ),
    ngoPresencePct: percentageMatching(records, (r) => r.ngoPresence),
  };
}

export async function getContaminationTypeDistribution(): Promise<
  { type: string; count: number }[]
> {
  const records = await getAllRecords();
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.contaminationType, (counts.get(r.contaminationType) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getWaterSourceDistribution(): Promise<
  { source: string; count: number }[]
> {
  const records = await getAllRecords();
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.waterSource, (counts.get(r.waterSource) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
