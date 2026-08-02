import { Header } from "@/components/dashboard/Header";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <Header title="About" />
      <main className="flex-1 p-6 space-y-6 max-w-3xl">
        <Card title="Origin">
          <p className="text-sm text-muted leading-relaxed">
            QleanFlow started as a submission to the AIMS Ghana Quantathon 2025, a
            hackathon focused on applying quantum computing to real-world problems in
            Ghana. The original team explored classical and quantum machine learning
            models for predicting water contamination risk from community-level data.
          </p>
          <p className="text-sm text-muted leading-relaxed mt-3">
            This repository is an independent rebuild of that concept: the underlying
            idea, dataset, and modeling approach are the same, but the dashboard,
            architecture, and codebase have been reconstructed from scratch as a
            standalone project — not a fork or copy of the original team&apos;s
            repository.
          </p>
        </Card>

        <Card title="Stack">
          <p className="text-sm text-muted leading-relaxed">
            Next.js (App Router) and TypeScript for the dashboard, Tailwind CSS for
            styling, and Recharts for data visualization. The Overview page&apos;s{" "}
            <Link href="/" className="text-accent hover:underline">
              Live Quantum Risk Estimator
            </Link>{" "}
            runs a real Quantum SVC kernel computation client-side, in the browser, on
            every input change - a genuine 4-qubit statevector simulation, not a static
            precomputed value. The QNN configuration referenced on the{" "}
            <Link href="/model" className="text-accent hover:underline">
              Model
            </Link>{" "}
            page reflects a separate model that was trained offline in Python and is shown
            as a historical reference result, not retrained in the browser.
          </p>
        </Card>

        <Card title="Data source">
          <p className="text-sm text-muted leading-relaxed">
            <code>data/ghana_water_quality_data.csv</code> — 500 labeled rows representing
            communities across 16 regions of Ghana. Its provenance is not verified in this
            repository; see the{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              Methodology
            </Link>{" "}
            page for details on the dataset and modeling approach.
          </p>
        </Card>
      </main>
    </>
  );
}
