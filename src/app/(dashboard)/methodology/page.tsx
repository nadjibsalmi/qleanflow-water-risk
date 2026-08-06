import { Header } from "@/components/dashboard/Header";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <>
      <Header title="Methodology" />
      <main className="flex-1 p-6 space-y-6 max-w-3xl">
        <Card title="Problem framing">
          <p className="text-sm text-muted leading-relaxed">
            Illegal small-scale mining (locally known as <em>galamsey</em>) has
            contaminated a significant share of Ghana&apos;s surface water with mercury,
            arsenic, cyanide, and heavy metals. Contamination is frequently invisible:
            affected water can look, smell, and taste identical to safe water, which makes
            visual inspection or community reporting an unreliable way to prioritize
            testing and remediation resources. This project treats water safety as a
            supervised classification problem — predicting water quality from measurable
            community, geographic, and socioeconomic indicators that correlate with
            contamination risk, without requiring a lab test for every source up front.
          </p>
        </Card>

        <Card title="Dataset">
          <p className="text-sm text-muted leading-relaxed">
            The bundled CSV contains 500 labeled rows representing communities across 16
            regions of Ghana, with geographic, environmental, and socioeconomic fields.
            Its provenance is not documented with a verifiable public source or collection
            record in this repository. An audit found 268 distinct community names: 232
            rows repeat an existing name with different statistics. This pattern is
            consistent with a generated or assembled proof-of-concept dataset, not proof
            of 500 independently sampled field communities. It must not be interpreted as
            verified field measurements.
          </p>
        </Card>

        <Card title="Why compare classical and quantum approaches">
          <p className="text-sm text-muted leading-relaxed">
            The feature set is small (18 features after dropping identifier columns like
            community name and coordinates, reduced to 4 principal components) and the
            sample size is modest — exactly the regime where near-term quantum machine
            learning methods are most plausible to evaluate meaningfully, since they
            don&apos;t yet scale to large feature spaces on real hardware or realistic
            simulators. Three trained approaches use identical preprocessed data so their
            performance is directly comparable: a classical SVM, a Quantum SVC (a
            classical SVM using a quantum-computed kernel), and a Quantum Neural Network
            (a variational circuit trained end-to-end with gradient descent). A
            majority-class reference is shown separately. See the{" "}
            <Link href="/model" className="text-accent hover:underline">
              Model
            </Link>{" "}
            page for the exact configuration used.
          </p>
        </Card>

        <Card title="Limitations">
          <ul className="text-sm text-muted leading-relaxed space-y-2 list-disc list-inside">
            <li>
              All quantum circuits run on classical simulators (PennyLane&apos;s{" "}
              <code>default.qubit</code> device), not real quantum hardware — results
              reflect the algorithm&apos;s behavior, not hardware-specific noise or
              decoherence effects.
            </li>
            <li>
              The CSV&apos;s external provenance and collection process are not documented
              in this repository. Repeated community names with different measurements
              indicate that it is best treated as a generated or assembled
              proof-of-concept dataset, not as verified field data or a continuously
              updated government or NGO monitoring system.
            </li>
            <li>
              A predicted &quot;safe&quot; classification is a risk-triage signal to
              prioritize lab testing, not a substitute for it.
            </li>
          </ul>
        </Card>
      </main>
    </>
  );
}
