import { Header } from "@/components/dashboard/Header";
import { Card } from "@/components/ui/Card";
import { CommunityMap } from "@/components/dashboard/CommunityMap";
import { getRegionSummaries, getAllRecords } from "@/services/waterQualityData";

export const metadata = { title: "Regions" };

export default async function RegionsPage() {
  const [regions, records] = await Promise.all([getRegionSummaries(), getAllRecords()]);

  return (
    <>
      <Header title="Regions" />
      <main className="flex-1 p-6 space-y-6">
        <p className="text-sm text-muted max-w-2xl">
          Regional breakdown of all {regions.reduce((s, r) => s + r.totalCommunities, 0)}{" "}
          labeled rows in the bundled proof-of-concept CSV, ranked by average
          contamination level.
        </p>

        <Card
          title="Geographic Distribution"
          subtitle="500 labeled rows, positioned by the coordinates in the CSV"
        >
          <CommunityMap records={records} />
        </Card>

        <Card>
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-muted">
                  <th className="px-5 py-3 font-medium">Region</th>
                  <th className="px-5 py-3 font-medium text-right">Communities</th>
                  <th className="px-5 py-3 font-medium text-right">Avg. contamination</th>
                  <th className="px-5 py-3 font-medium text-right">Good quality</th>
                  <th className="px-5 py-3 font-medium text-right">Mining zone</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, i) => (
                  <tr
                    key={r.region}
                    className={
                      i !== regions.length - 1 ? "border-b border-surface-border/60" : ""
                    }
                  >
                    <td className="px-5 py-3 font-medium">{r.region}</td>
                    <td className="px-5 py-3 text-right text-muted">
                      {r.totalCommunities}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={
                          r.avgContamination > 3
                            ? "text-danger font-medium"
                            : r.avgContamination > 2.5
                              ? "text-warning font-medium"
                              : "text-success font-medium"
                        }
                      >
                        {r.avgContamination}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      {r.goodQualityPct}%
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      {r.miningZonePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
