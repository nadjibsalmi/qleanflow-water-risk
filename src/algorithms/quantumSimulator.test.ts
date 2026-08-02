import { describe, it, expect } from "vitest";
import { quantumKernel, featureMapState } from "./quantumSimulator";
import { QSVC_PARAMS } from "./data/qsvcParams";

describe("quantumKernel (cross-verified against the Python reference implementation)", () => {
  const sv = QSVC_PARAMS.supportVectors;

  it("self-kernel is exactly 1.0 (a feature-mapped state always has perfect overlap with itself)", () => {
    expect(quantumKernel(sv[0], sv[0])).toBeCloseTo(1.0, 10);
  });

  it("matches the Python-computed kernel(support_vector[0], support_vector[1]) exactly", () => {
    // Reference value printed by scripts/train_qsvc_model.py:
    // "Kernel(support_vector[0], support_vector[1]): 0.5627555212755921"
    expect(quantumKernel(sv[0], sv[1])).toBeCloseTo(0.5627555212755921, 9);
  });

  it("the featureMapState produces a valid (normalized) quantum state", () => {
    // Any valid quantum statevector must have norm 1 - a real, checkable
    // property of the simulator, independent of the Python reference.
    const state = featureMapState([0.3, 1.2, 2.5, 0.1]);
    const normSquared = state.reduce((sum, amp) => sum + amp * amp, 0);
    expect(normSquared).toBeCloseTo(1.0, 10);
  });

  it("kernel is symmetric", () => {
    const a = [0.5, 1.0, 1.5, 2.0];
    const b = [2.5, 0.2, 3.0, 0.8];
    expect(quantumKernel(a, b)).toBeCloseTo(quantumKernel(b, a), 12);
  });

  it("kernel values are always between 0 and 1 (fidelity is a probability)", () => {
    for (let i = 0; i < 20; i++) {
      const a = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ];
      const b = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ];
      const k = quantumKernel(a, b);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});
