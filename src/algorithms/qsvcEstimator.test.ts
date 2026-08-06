import { describe, it, expect } from "vitest";
import { estimateQsvcRisk } from "./qsvcEstimator";

const baseline = {
  distanceToRiverKm: 10,
  isMiningZone: false,
  waterAccessScore: 5,
  avgHouseholdIncomeGHS: 2700,
  educationYears: 7,
};

describe("estimateQsvcRisk - predictedLabel/riskLevel consistency", () => {
  it("never disagrees between predictedLabel and riskLevel across the full contamination range", () => {
    // Sweep the full realistic slider range (0-10, matching
    // QuantumRiskEstimator.tsx) to ensure both classifications remain
    // consistent across all supported contamination values.
    for (let c = 0; c <= 10; c += 0.1) {
      const result = estimateQsvcRisk({ ...baseline, contaminationLevel: c });

      const labelSaysGood = result.predictedLabel === 1;
      const riskSaysGood = result.riskLevel === "low" || result.riskLevel === "moderate";

      expect(labelSaysGood).toBe(riskSaysGood);
    }
  });

  it("predictedLabel and riskLevel are both derived from the same probability threshold", () => {
    const result = estimateQsvcRisk({ ...baseline, contaminationLevel: 5 });
    const expectedLabel = result.goodQualityProbability >= 0.5 ? 1 : 0;
    expect(result.predictedLabel).toBe(expectedLabel);
  });
});
