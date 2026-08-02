/**
 * A minimal, genuine quantum statevector simulator, sized for the exact
 * circuit this project needs: N qubits, each initialized to |0>, with a
 * single RY(theta) rotation applied per qubit (PennyLane's "AngleEmbedding"
 * feature map, as used in the original project's QSVC notebook).
 *
 * This computes the ACTUAL 2^N-dimensional statevector via tensor
 * (Kronecker) products of each qubit's post-rotation state - it does not
 * take a mathematical shortcut. For 4 qubits this is a 16-dimensional
 * vector, computed in microseconds; the point is that this is a real,
 * verifiable simulation of the quantum circuit's evolution, not a fitted
 * approximation.
 *
 * All amplitudes here are real numbers (not complex): RY is a real-valued
 * rotation matrix, and with no other gates in this feature map, the
 * resulting statevector never acquires an imaginary component. If this
 * project's circuit ever adds gates with complex amplitudes (e.g. RZ, S,
 * or a phase gate), this simulator would need to switch to complex
 * arithmetic - documented here so that assumption isn't silently violated
 * later.
 *
 * IMPORTANT LIMITATION: this feature map is separable. It applies only
 * independent RY rotations and contains no entangling gate, so it does not
 * demonstrate an entanglement-based quantum advantage. Its fidelity has the
 * closed-form equivalent:
 *
 *   K(x, y) = product_i cos²((x_i - y_i) / 2)
 *
 * The explicit statevector simulation is retained for transparency and for
 * parity with the training notebook; this formula makes the mathematical
 * limitation explicit rather than implying that the kernel is intrinsically
 * more expressive than its classical equivalent.
 */

/** Single-qubit state after RY(theta)|0>: real 2-vector [cos(t/2), sin(t/2)]. */
function ryQubitState(theta: number): [number, number] {
  const half = theta / 2;
  return [Math.cos(half), Math.sin(half)];
}

/** Tensor (Kronecker) product of two real vectors. */
function kron(a: number[], b: number[]): number[] {
  const result = new Array(a.length * b.length);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i * b.length + j] = a[i] * b[j];
    }
  }
  return result;
}

/**
 * Computes the full N-qubit statevector after applying RY(angles[i]) to
 * qubit i for every qubit, starting from |0...0>. This is a real tensor
 * product of N independent single-qubit states (AngleEmbedding has no
 * entangling gates), computed explicitly rather than via its closed-form
 * shortcut. The absence of entanglement is an intentional limitation of the
 * current reproduced model, not a claim of quantum advantage.
 */
export function featureMapState(angles: number[]): number[] {
  let state: number[] = [1];
  for (const theta of angles) {
    const qubitState = ryQubitState(theta);
    state = kron(state, Array.from(qubitState));
  }
  return state;
}

/** Dot product of two real vectors. Not exported: internal building block only. */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Quantum fidelity |<psi1|psi2>|^2 between two ALREADY-COMPUTED statevectors.
 * Since all amplitudes in this circuit are real (see module docstring), the
 * inner product is a plain dot product and the fidelity is its square.
 *
 * This is the single source of truth for the fidelity formula. Both
 * `quantumKernel` below (computes both states from angles) and
 * `qsvcEstimator.ts`'s optimized inference path (which precomputes and
 * caches support-vector states once, then only computes the query state
 * fresh per call) call through this same function - there is exactly one
 * place where "fidelity" is defined, so the two code paths cannot silently
 * drift into different formulas.
 */
export function fidelityFromStates(state1: number[], state2: number[]): number {
  const overlap = dot(state1, state2);
  return overlap * overlap;
}

/**
 * Quantum kernel: fidelity |<psi(angles1)|psi(angles2)>|^2 between the two
 * feature-mapped quantum states, computing both states from their raw
 * rotation angles. This is the natural "from scratch" entry point (used
 * directly by tests, and by any caller that doesn't already have a
 * precomputed statevector on either side); qsvcEstimator.ts's live
 * inference path uses `fidelityFromStates` directly instead, since it
 * keeps support-vector states cached across calls.
 */
export function quantumKernel(angles1: number[], angles2: number[]): number {
  return fidelityFromStates(featureMapState(angles1), featureMapState(angles2));
}
