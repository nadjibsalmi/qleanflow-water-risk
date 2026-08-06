import { describe, it, expect, vi } from "vitest";
import {
  getAllRecords,
  getContaminationTypeDistribution,
  getOverallStats,
  getRegionSummaries,
  getWaterSourceDistribution,
  safeNumber,
  mapRow,
} from "./waterQualityData";

describe("safeNumber (audit fix: NaN handling centralized at ingestion)", () => {
  it("returns the parsed value for well-formed input", () => {
    expect(safeNumber("5.5", parseFloat, "testField", "Test Town")).toBe(5.5);
  });

  it("substitutes 0 for malformed input instead of returning NaN", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = safeNumber("N/A", parseFloat, "contaminationLevel", "Test Town");

    expect(result).toBe(0);
    expect(Number.isNaN(result)).toBe(false);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("contaminationLevel");
    expect(warnSpy.mock.calls[0][0]).toContain("Test Town");

    warnSpy.mockRestore();
  });

  it("substitutes 0 for an empty string", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(safeNumber("", parseFloat, "population", "Test Town")).toBe(0);
    warnSpy.mockRestore();
  });
});

describe("mapRow (audit fix regression test: no field can produce NaN in a mapped record)", () => {
  const baseRow: Record<string, string> = {
    Community: "Test Town",
    Region: "Ashanti",
    Latitude: "6.5",
    Longitude: "-1.5",
    "Water Quality": "1",
    "Distance to Nearest River (km)": "5.0",
    "Is Mining Zone": "0",
    "Contamination Level": "2.5",
    "Contamination Type": "Bacteria",
    "Water Source": "Well",
    "Water Access Score": "5.0",
    "Number of Children": "100",
    Population: "1000",
    "Average Daily Water Needs (liters)": "5000",
    "Prevalence of Water Borne Diseases": "0.1",
    Accessibility: "Road access",
    "Urban/Rural": "Urban",
    "Sanitation Facilities Available": "1",
    "Average Household Income (GHS)": "2000",
    "Education Level (Avg Years)": "8",
    "Government Intervention Present": "1",
    "NGO Presence": "1",
    "Year Data Collected": "2020",
  };

  it("maps a well-formed row with no NaN anywhere", () => {
    const record = mapRow(baseRow);
    const numericValues = Object.values(record).filter(
      (v): v is number => typeof v === "number"
    );
    expect(numericValues.every((v) => !Number.isNaN(v))).toBe(true);
  });

  it("substitutes 0, not NaN, when a critical numeric field is malformed", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badRow = { ...baseRow, "Contamination Level": "N/A" };

    const record = mapRow(badRow);

    expect(record.contaminationLevel).toBe(0);
    expect(Number.isNaN(record.contaminationLevel)).toBe(false);

    warnSpy.mockRestore();
  });

  it("guarantees every numeric field in the mapped record is real number, never NaN, even with multiple malformed fields", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badRow = {
      ...baseRow,
      "Contamination Level": "N/A",
      Population: "",
      "Water Access Score": "not-a-number",
    };

    const record = mapRow(badRow);
    const numericValues = Object.values(record).filter(
      (v): v is number => typeof v === "number"
    );

    expect(numericValues.every((v) => !Number.isNaN(v))).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(3);

    warnSpy.mockRestore();
  });
});

describe("CSV aggregations", () => {
  it("loads the complete dataset and preserves the quality labels", async () => {
    const records = await getAllRecords();

    expect(records).toHaveLength(500);
    expect(records.every((record) => record.community.length > 0)).toBe(true);
    expect(
      records.every((record) => record.waterQuality === 0 || record.waterQuality === 1)
    ).toBe(true);
  });

  it("aggregates regions into all 500 records and sorts by contamination", async () => {
    const summaries = await getRegionSummaries();

    expect(summaries.length).toBeGreaterThan(1);
    expect(
      summaries.reduce((total, summary) => total + summary.totalCommunities, 0)
    ).toBe(500);
    expect(summaries.every((summary) => summary.goodQualityPct >= 0)).toBe(true);
    expect(
      summaries.every(
        (summary, index) =>
          index === 0 || summaries[index - 1].avgContamination >= summary.avgContamination
      )
    ).toBe(true);
  });

  it("calculates overall percentages and numeric averages from the CSV", async () => {
    const stats = await getOverallStats();

    expect(stats.totalCommunities).toBe(500);
    expect(stats.totalPopulation).toBeGreaterThan(0);
    expect(stats.goodQualityPct).toBe(74.6);
    expect(stats.miningZonePct).toBeGreaterThanOrEqual(0);
    expect(stats.miningZonePct).toBeLessThanOrEqual(100);
    expect(Number.isFinite(stats.avgDiseasePrevalence)).toBe(true);
    expect(Number.isFinite(stats.avgWaterAccessScore)).toBe(true);
  });

  it("returns sorted contamination and water-source distributions that sum to 500", async () => {
    const [contamination, sources] = await Promise.all([
      getContaminationTypeDistribution(),
      getWaterSourceDistribution(),
    ]);

    expect(contamination.reduce((total, item) => total + item.count, 0)).toBe(500);
    expect(sources.reduce((total, item) => total + item.count, 0)).toBe(500);
    expect(
      contamination.every(
        (item, index) => index === 0 || contamination[index - 1].count >= item.count
      )
    ).toBe(true);
    expect(
      sources.every(
        (item, index) => index === 0 || sources[index - 1].count >= item.count
      )
    ).toBe(true);
  });
});
