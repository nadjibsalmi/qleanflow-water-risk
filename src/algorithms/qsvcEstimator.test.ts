import { describe, it, expect } from "vitest";
import { estimateQsvcRisk } from "./qsvcEstimator";

const baseline = {
  distanceToRiverKm: 10,
  isMiningZone: false,
  waterAccessScore: 5,
  avgHouseholdIncomeGHS: 2700,
  educationYears: 7,
};

describe("estimateQsvcRisk - predictedLabel/riskLevel consistency (audit fix regression test)", () => {
  it("never disagrees between predictedLabel and riskLevel across the full contamination range", () => {
    // AUDIT FIX regression test: predictedLabel and riskLevel were
    // previously derived from two different values (raw decisionValue
    // sign vs. calibrated probability), which disagreed for
    // contaminationLevel roughly 8.9-9.7. Sweeping the full realistic
    // slider range here (0-10, matching QuantumRiskEstimator.tsx) proves
    // the fix holds everywhere, not just at the one value that exposed
    // the original bug.
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
