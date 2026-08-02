import { Droplets, Users, ShieldAlert, HeartPulse } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { RegionContaminationChart } from "@/components/dashboard/RegionContaminationChart";
import { ContaminationTypeChart } from "@/components/dashboard/ContaminationTypeChart";
import { QuantumRiskEstimator } from "@/components/dashboard/QuantumRiskEstimator";
import {
  getOverallStats,
  getRegionSummaries,
  getContaminationTypeDistribution,
} from "@/services/waterQualityData";

export default async function OverviewPage() {
  const [stats, regions, contaminationTypes] = await Promise.all([
    getOverallStats(),
    getRegionSummaries(),
    getContaminationTypeDistribution(),
  ]);

  const highestRiskRegion = regions[0];

  return (
    <>
      <Header title="Overview" />
      <main className="flex-1 p-6 space-y-6">
        <div>
          <p className="text-sm text-muted max-w-2xl">
            Live risk assessment across {stats.totalCommunities} labeled rows representing
            communities in
            mining-affected regions of Ghana, covering roughly{" "}
            {stats.totalPopulation.toLocaleString()} people.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Communities surveyed"
            value={stats.totalCommunities.toString()}
            icon={Droplets}
            hint="Across 16 regions"
          />
          <KpiCard
            label="Good water quality"
            value={`${stats.goodQualityPct}%`}
            icon={ShieldAlert}
            tone={stats.goodQualityPct >= 70 ? "success" : "warning"}
            hint={`${(100 - stats.goodQualityPct).toFixed(1)}% flagged as unsafe`}
          />
          <KpiCard
            label="In mining zones"
            value={`${stats.miningZonePct}%`}
            icon={Users}
            tone="warning"
            hint="Highest contamination risk"
          />
          <KpiCard
            label="Disease prevalence"
            value={stats.avgDiseasePrevalence.toFixed(3)}
            icon={HeartPulse}
            tone="danger"
            hint="Avg. waterborne disease rate"
          />
        </div>

        <Card
          title="Live Quantum Risk Estimator"
          subtitle="Real quantum kernel SVM (QSVC) inference, computed in your browser"
        >
          <QuantumRiskEstimator />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            title="Contamination by region"
            subtitle={`Highest: ${highestRiskRegion.region} (${highestRiskRegion.avgContamination})`}
          >
            <RegionContaminationChart data={regions} />
          </Card>
          <Card title="Contamination type distribution">
            <ContaminationTypeChart data={contaminationTypes} />
          </Card>
        </div>

        <Card
          title="Intervention coverage"
          subtitle="Share of labeled rows receiving external support"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">Government intervention</span>
                <span className="font-medium">{stats.governmentInterventionPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${stats.governmentInterventionPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">NGO presence</span>
                <span className="font-medium">{stats.ngoPresencePct}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${stats.ngoPresencePct}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
