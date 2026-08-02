"use client";

import { useMemo, useState } from "react";
import { Atom, AlertTriangle } from "lucide-react";
import { estimateQsvcRisk, type RiskLevel } from "@/algorithms/qsvcEstimator";
import { QSVC_PARAMS } from "@/algorithms/data/qsvcParams";

/**
 * AUDIT FIX (round 3): previously `Record<string, string>` - the exact
 * same stringly-typed pattern fixed for FEATURE_INDEX in the round-2
 * audit, just not yet applied here. `estimateQsvcRisk()` returns a real
 * `RiskLevel` union type (`"low" | "moderate" | "high" | "critical"`),
 * but this lookup object wasn't typed against it - so a typo'd key, or a
 * future 5th risk level added to the union without updating this map,
 * would compile cleanly and silently render `undefined` as a CSS
 * className at runtime (a blank/broken style, not a crash, but exactly
 * the class of silent regression Directive #3 targets). `Record<RiskLevel,
 * string>` makes TypeScript require all 4 keys, exactly once each, with
 * no extras and no typos - verified by deliberately removing one key and
 * confirming `tsc --noEmit` fails with a missing-property error.
 */
const RISK_COLORS: Record<RiskLevel, string> = {
  low: "text-success",
  moderate: "text-accent",
  high: "text-warning",
  critical: "text-danger",
};

/**
 * The flagship interactive feature: a real quantum kernel computation
 * (see algorithms/quantumSimulator.ts + qsvcEstimator.ts) runs entirely in
 * the browser as the user adjusts inputs. This replaces the earlier
 * earlier classical logistic-regression-based estimator. The QSVC's historical
 * notebook score was 83.33%; the current classical SVM reference is reported
 * as 79.8% +/- 2.8% across five folds, while the QNN's final accuracy was
 * never captured (see config/model.ts).
 */
export function QuantumRiskEstimator() {
  const [distanceToRiverKm, setDistanceToRiverKm] = useState(10);
  const [isMiningZone, setIsMiningZone] = useState(false);
  const [contaminationLevel, setContaminationLevel] = useState(3);
  const [waterAccessScore, setWaterAccessScore] = useState(5);
  const [avgHouseholdIncomeGHS, setAvgHouseholdIncomeGHS] = useState(2700);
  const [educationYears, setEducationYears] = useState(7);

  const result = useMemo(
    () =>
      estimateQsvcRisk({
        distanceToRiverKm,
        isMiningZone,
        contaminationLevel,
        waterAccessScore,
        avgHouseholdIncomeGHS,
        educationYears,
      }),
    [
      distanceToRiverKm,
      isMiningZone,
      contaminationLevel,
      waterAccessScore,
      avgHouseholdIncomeGHS,
      educationYears,
    ]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <SliderInput
          label="Distance to nearest river"
          value={distanceToRiverKm}
          onChange={setDistanceToRiverKm}
          min={0}
          max={30}
          step={0.5}
          unit="km"
        />
        <SliderInput
          label="Contamination level (measured)"
          value={contaminationLevel}
          onChange={setContaminationLevel}
          min={0}
          max={10}
          step={0.1}
        />
        <SliderInput
          label="Water access score"
          value={waterAccessScore}
          onChange={setWaterAccessScore}
          min={0}
          max={10}
          step={0.1}
        />
        <SliderInput
          label="Avg. household income"
          value={avgHouseholdIncomeGHS}
          onChange={setAvgHouseholdIncomeGHS}
          min={200}
          max={6000}
          step={50}
          unit="GHS"
        />
        <SliderInput
          label="Avg. education level"
          value={educationYears}
          onChange={setEducationYears}
          min={0}
          max={16}
          step={0.5}
          unit="years"
        />
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isMiningZone}
            onChange={(e) => setIsMiningZone(e.target.checked)}
            className="w-4 h-4 rounded accent-accent"
          />
          Located in an active mining zone
        </label>
      </div>

      <div className="flex flex-col justify-center">
        <div className="rounded-xl border border-surface-border bg-surface/40 p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted uppercase tracking-wide">
            <Atom className="w-3.5 h-3.5 text-accent" />
            Quantum kernel inference (live, in-browser)
          </div>
          <div>
            <div className="text-4xl font-semibold tracking-tight">
              {(result.goodQualityProbability * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted mt-1">predicted good water quality</p>
          </div>
          <div
            className={`text-sm font-medium uppercase tracking-wide ${RISK_COLORS[result.riskLevel]}`}
          >
            {result.riskLevel} risk
          </div>
          <div className="pt-3 border-t border-surface-border/60 text-xs text-muted space-y-1">
            <p>
              SVM decision margin:{" "}
              <span className="font-mono">{result.decisionValue.toFixed(4)}</span>
            </p>
            <p>
              Quantum kernel evaluated against{" "}
              <span className="font-mono">{result.quantumKernelValues.length}</span>{" "}
              support vectors (4-qubit statevector simulation)
            </p>
          </div>
          {result.featuresHeldAtMean.length > 0 && (
            <div className="flex items-start gap-2 text-left text-xs text-muted bg-warning/5 border border-warning/20 rounded-lg p-3">
              <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
              <span>
                {result.featuresHeldAtMean.length} of {QSVC_PARAMS.featureNames.length}{" "}
                model features aren&apos;t exposed as inputs above and are held at their
                fitted CSV mean instead of a guess.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const id = `slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span className="font-medium font-mono">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
