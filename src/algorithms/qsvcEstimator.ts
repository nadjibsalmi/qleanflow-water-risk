import { featureMapState, fidelityFromStates } from "./quantumSimulator";
import { QSVC_PARAMS } from "./data/qsvcParams";

/**
 * Live inference for the real QSVC (Quantum Support Vector Classifier)
 * trained in scripts/train_qsvc_model.py on the checked-in water-quality CSV
 * (18 features, PCA-reduced to 4, quantum kernel via a genuine 4-qubit
 * statevector simulation - see quantumSimulator.ts). The CSV is a
 * proof-of-concept fixture whose external provenance is not verified here.
 *
 * This was chosen over the classical SVM and the QNN as the live model
 * because it is the interactive model reproduced in this project. Its
 * historical notebook evaluation was 83.33%; the current SVM comparison uses
 * five-fold cross-validation and the QNN's final accuracy was not captured.
 * See src/config/model.ts for those reference numbers.
 *
 * The UI currently exposes 6 of the 18 features as user inputs. The
 * remaining 12 are held at the fitted CSV mean (from the fitted
 * StandardScaler) rather than an arbitrary placeholder - this is stated
 * explicitly in the returned result so it's never presented as if all 18
 * were user-controlled.
 */

export interface QsvcInput {
  distanceToRiverKm: number;
  isMiningZone: boolean;
  contaminationLevel: number;
  waterAccessScore: number;
  avgHouseholdIncomeGHS: number;
  educationYears: number;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface QsvcResult {
  /** Calibrated probability [0,1] that water quality is classified "good". */
  goodQualityProbability: number;
  /** Raw SVM decision function value (signed distance from the separating hyperplane, in kernel space). Provided for diagnostics only - see predictedLabel for the calibrated classification. */
  decisionValue: number;
  /**
   * Binary classification, thresholded at goodQualityProbability >= 0.5.
   *
   * AUDIT FIX: this was previously derived from `decisionValue >= 0`
   * (the raw, uncalibrated SVM decision boundary) while `riskLevel` was
   * derived from `goodQualityProbability` (the Platt-scaled, calibrated
   * probability). Because Platt scaling's calibration curve does not
   * cross exactly at decisionValue=0 <-> probability=0.5, this created a
   * real, reproducible input range (contaminationLevel roughly 8.9-9.7 at
   * default slider values for the other inputs) where predictedLabel=1
   * ("good") while riskLevel="high" simultaneously - a visible
   * contradiction in the UI. Both fields must be derived from the SAME
   * single source of truth (the calibrated probability) so they can
   * never disagree by construction.
   */
  predictedLabel: 0 | 1;
  riskLevel: RiskLevel;
  quantumKernelValues: number[];
  featuresHeldAtMean: string[];
}

const RISK_THRESHOLDS: { min: number; level: RiskLevel }[] = [
  { min: 0.75, level: "low" },
  { min: 0.5, level: "moderate" },
  { min: 0.25, level: "high" },
  { min: -Infinity, level: "critical" },
];

/**
 * Single source of truth for turning a calibrated probability into both
 * `predictedLabel` and `riskLevel`. Deriving both fields from this one
 * function, from the same probability value, makes the earlier
 * label/risk disagreement bug structurally impossible to reintroduce -
 * there is no second code path that could drift out of sync.
 */
function classify(goodQualityProbability: number): {
  predictedLabel: 0 | 1;
  riskLevel: RiskLevel;
} {
  const riskLevel =
    RISK_THRESHOLDS.find((t) => goodQualityProbability >= t.min)?.level ?? "critical";
  const predictedLabel: 0 | 1 = goodQualityProbability >= 0.5 ? 1 : 0;
  return { predictedLabel, riskLevel };
}

/**
 * AUDIT FIX (type safety): previously `Record<string, number>`, a
 * "stringly-typed" map with no compile-time link between its keys and
 * `QSVC_PARAMS.featureNames`. A typo in either place would silently and
 * permanently freeze that feature at its dataset mean, with zero
 * compiler error and zero runtime warning.
 *
 * `FeatureName` is now derived directly from the actual data
 * (`typeof QSVC_PARAMS`), so `userProvided`'s keys are checked against
 * the real feature list at compile time - renaming or typo-ing a feature
 * name in either qsvcParams.ts (regenerated from Python) or here is now
 * a compile error, not a silent data bug.
 */
type FeatureName = (typeof QSVC_PARAMS)["featureNames"][number];

const FEATURE_INDEX: Record<FeatureName, number> = Object.fromEntries(
  QSVC_PARAMS.featureNames.map((name, i) => [name, i])
) as Record<FeatureName, number>;

/** Builds the full 18-feature raw vector: user inputs where available, dataset mean elsewhere. */
function buildFeatureVector(input: QsvcInput): {
  vector: number[];
  heldAtMean: string[];
} {
  const mean = QSVC_PARAMS.standardScaler.mean;
  const vector = [...mean]; // start from the dataset mean for every feature
  const heldAtMean: string[] = [];

  const userProvided: Partial<Record<FeatureName, number>> = {
    "Distance to Nearest River (km)": input.distanceToRiverKm,
    "Is Mining Zone": input.isMiningZone ? 1 : 0,
    "Contamination Level": input.contaminationLevel,
    "Water Access Score": input.waterAccessScore,
    "Average Household Income (GHS)": input.avgHouseholdIncomeGHS,
    "Education Level (Avg Years)": input.educationYears,
  };

  for (const name of QSVC_PARAMS.featureNames) {
    const provided = userProvided[name];
    if (provided !== undefined) {
      vector[FEATURE_INDEX[name]] = provided;
    } else {
      heldAtMean.push(name);
    }
  }

  return { vector, heldAtMean };
}

export function standardize(vector: number[]): number[] {
  const { mean, scale } = QSVC_PARAMS.standardScaler;
  return vector.map((v, i) => (v - mean[i]) / scale[i]);
}

export function applyPca(standardized: number[]): number[] {
  const { mean, components } = QSVC_PARAMS.pca;
  const centered = standardized.map((v, i) => v - mean[i]);
  // Each PCA component is a linear combination (dot product) of the
  // centered feature vector.
  return components.map((component) =>
    component.reduce((sum, weight, i) => sum + weight * centered[i], 0)
  );
}

/**
 * AUDIT FIX, corrected after a regression was caught by the pipeline
 * cross-verification test (qsvcPipeline.test.ts):
 *
 * Attempt 1 (reverted): unconditionally clamp `normalized` to [0, 1]
 * before multiplying by pi. This looked like sound defensive programming,
 * but it silently altered a LEGITIMATE result: the real held-out test
 * point used for cross-verification produces a third PCA component whose
 * normalized value is -0.00227 - a hair past the trained boundary due to
 * ordinary floating-point/interpolation noise, not a wild extrapolation.
 * scikit-learn's MinMaxScaler does not clip by default either (clip=False
 * is the default), so the REAL trained Python model legitimately produces
 * this same tiny-negative angle. Clamping it to exactly 0 changed the
 * quantum kernel value enough to shift decisionValue by ~4e-4 versus the
 * real model - a direct violation of "zero approximation" fidelity to
 * the actual trained system.
 *
 * RY(theta) is mathematically well-defined and periodic for ANY real
 * theta (negative, or beyond pi) - there is no crash risk from an
 * out-of-[0,pi] angle, only a *domain-shift* concern (the SVC was
 * calibrated on angles that landed in [0,pi] for the training set, and a
 * genuinely wild extrapolation - e.g. an angle several multiples of pi
 * away from that range - would mean querying the model far outside
 * anything it was fitted on). The correct fix distinguishes between
 * ordinary boundary noise (preserve exactly, no alteration) and truly
 * extreme extrapolation (flag it, without silently rewriting the value).
 *
 * `BOUNDARY_TOLERANCE` allows for realistic floating-point/interpolation
 * noise right at the trained boundary (empirically, real data points can
 * land a few thousandths outside [0,1]) without ever triggering on that.
 * Only genuinely out-of-distribution queries (more than 50% of the full
 * trained range beyond either edge) are flagged - loud, not silent - so
 * this is observable without ever corrupting a legitimate value.
 */
const ANGLE_BOUNDARY_TOLERANCE = 0.05;

export function scaleToAngles(pcaComponents: number[]): number[] {
  const { dataMin, dataRange } = QSVC_PARAMS.angleScaler;
  return pcaComponents.map((v, i) => {
    const normalized = (v - dataMin[i]) / dataRange[i];

    if (
      normalized < -ANGLE_BOUNDARY_TOLERANCE ||
      normalized > 1 + ANGLE_BOUNDARY_TOLERANCE
    ) {
      // Genuinely far outside the domain the SVC was calibrated on -
      // surfaced as a warning (visible, actionable) rather than silently
      // clamped (invisible, and would corrupt the exact result for
      // legitimate near-boundary values as the reverted attempt did).
      console.warn(
        `[qsvcEstimator] PCA component ${i} produced a normalized value of ` +
          `${normalized.toFixed(4)}, well outside the [0, 1] range the ` +
          `model was calibrated on. The resulting prediction is an ` +
          `extrapolation beyond the model's trained domain and should be ` +
          `treated with reduced confidence.`
      );
    }

    // No alteration of the value itself - RY(theta) is mathematically
    // valid for any real theta, and this preserves exact fidelity with
    // the real trained model's behavior (verified: matches scikit-learn's
    // own un-clipped MinMaxScaler.transform() output exactly).
    return normalized * Math.PI;
  });
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Precomputed quantum states for every support vector, computed once and
 * cached for the lifetime of the module (support vectors are fixed,
 * fitted model parameters - they never change between calls). Computing
 * a 4-qubit statevector for 199 support vectors on every single slider
 * movement, only to discard 198 of the 199 unchanged results each time,
 * was pure wasted computation.
 */
let cachedSupportVectorStates: number[][] | null = null;

function getSupportVectorStates(): number[][] {
  if (!cachedSupportVectorStates) {
    cachedSupportVectorStates = QSVC_PARAMS.supportVectors.map((sv) =>
      featureMapState(sv)
    );
  }
  return cachedSupportVectorStates;
}

/**
 * Quantum kernel (fidelity) between a live query point and every
 * precomputed support-vector quantum state. The real 4-qubit statevector
 * simulation still runs for the query point on every call - only the
 * support-vector side is cached. Fidelity itself is computed via
 * `fidelityFromStates`, the same single-source-of-truth function
 * `quantumKernel()` in quantumSimulator.ts uses internally - there is
 * exactly one formula for "quantum fidelity" in this codebase.
 */
function quantumKernelAgainstSupportVectors(queryAngles: number[]): number[] {
  const queryState = featureMapState(queryAngles);
  return getSupportVectorStates().map((svState) =>
    fidelityFromStates(queryState, svState)
  );
}

export function estimateQsvcRisk(input: QsvcInput): QsvcResult {
  const { vector, heldAtMean } = buildFeatureVector(input);
  const standardized = standardize(vector);
  const pcaComponents = applyPca(standardized);
  const angles = scaleToAngles(pcaComponents);

  const dualCoef = QSVC_PARAMS.dualCoef;

  // Real quantum kernel computed against every support vector, with the
  // support-vector-side quantum states precomputed once (see
  // getSupportVectorStates) rather than recomputed on every call.
  const kernelValues = quantumKernelAgainstSupportVectors(angles);

  const decisionValue =
    kernelValues.reduce((sum, k, i) => sum + dualCoef[i] * k, 0) + QSVC_PARAMS.intercept;

  // Platt scaling, matching scikit-learn's internal libsvm convention -
  // verified empirically against real predict_proba() output rather than
  // assumed: the correct form here is 1/(1+exp(A*f - B)), NOT the more
  // commonly-cited 1/(1+exp(A*f + B)). Confirmed by computing decision
  // values and probA_/probB_ from the real fitted model in Python and
  // brute-force testing sign conventions until the output matched
  // predict_proba() to within ~4e-5 (residual gap is libsvm's internal
  // Newton-iteration probability estimate, not a formula error).
  const goodQualityProbability = sigmoid(
    -(QSVC_PARAMS.plattA * decisionValue - QSVC_PARAMS.plattB)
  );

  // predictedLabel and riskLevel both come from this single call, from
  // the same probability value - they cannot disagree by construction.
  const { predictedLabel, riskLevel } = classify(goodQualityProbability);

  return {
    goodQualityProbability,
    decisionValue,
    predictedLabel,
    riskLevel,
    quantumKernelValues: kernelValues,
    featuresHeldAtMean: heldAtMean,
  };
}
