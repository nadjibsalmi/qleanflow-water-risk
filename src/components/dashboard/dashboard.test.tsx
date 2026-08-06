import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CommunityRecord, RegionSummary } from "@/services/waterQualityData";
import { CommunityMap } from "./CommunityMap";
import { ContaminationTypeChart } from "./ContaminationTypeChart";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { RegionContaminationChart } from "./RegionContaminationChart";
import { Sidebar } from "./Sidebar";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/model",
}));

vi.mock("recharts", () => {
  function Shell({ testId, children }: { testId: string; children?: React.ReactNode }) {
    return <div data-testid={testId}>{children}</div>;
  }

  function empty() {
    return null;
  }

  return {
    Bar: empty,
    BarChart: (props: { children?: React.ReactNode }) => (
      <Shell testId="bar-chart" {...props} />
    ),
    CartesianGrid: empty,
    Cell: empty,
    Legend: empty,
    Pie: empty,
    PieChart: (props: { children?: React.ReactNode }) => (
      <Shell testId="pie-chart" {...props} />
    ),
    ResponsiveContainer: (props: { children?: React.ReactNode }) => (
      <Shell testId="responsive-container" {...props} />
    ),
    Scatter: empty,
    ScatterChart: (props: { children?: React.ReactNode }) => (
      <Shell testId="scatter-chart" {...props} />
    ),
    Tooltip: empty,
    XAxis: empty,
    YAxis: empty,
    ZAxis: empty,
  };
});

const record: CommunityRecord = {
  community: "Test Town",
  region: "Ashanti",
  latitude: 6.5,
  longitude: -1.5,
  waterQuality: 1,
  distanceToRiverKm: 5,
  isMiningZone: true,
  contaminationLevel: 6,
  contaminationType: "Heavy metals",
  waterSource: "River",
  waterAccessScore: 4,
  numberOfChildren: 100,
  population: 1000,
  avgDailyWaterNeedsLiters: 5000,
  diseasePrevalence: 0.1,
  accessibility: "Road access",
  urbanRural: "Urban",
  sanitationFacilities: "Available",
  avgHouseholdIncomeGHS: 2000,
  educationLevelYears: 8,
  governmentIntervention: true,
  ngoPresence: false,
  yearCollected: 2020,
};

const regionSummary: RegionSummary = {
  region: "Ashanti",
  totalCommunities: 1,
  avgContamination: 6,
  goodQualityPct: 100,
  miningZonePct: 100,
};

describe("dashboard components", () => {
  it("renders the Sidebar with the active navigation item", () => {
    render(<Sidebar />);

    expect(screen.getByText("QleanFlow")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Model" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders the Header title and theme control", () => {
    render(<Header title="Overview" />);

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle color theme" })
    ).toBeInTheDocument();
  });

  it("renders the CommunityMap accessibility summary for its records", () => {
    render(<CommunityMap records={[record]} />);

    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Geographic scatter plot of 1 communities across Ghana. 1 are in active mining zones (shown in red). 1 have high contamination levels (5 or above)."
    );
    expect(screen.getByTestId("scatter-chart")).toBeInTheDocument();
    expect(screen.getByText("Mining zone")).toBeInTheDocument();
  });

  it("renders the contamination type chart shell for supplied categories", () => {
    render(
      <ContaminationTypeChart
        data={[
          { type: "Heavy metals", count: 3 },
          { type: "Bacteria", count: 2 },
        ]}
      />
    );

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders the region contamination chart shell for supplied summaries", () => {
    render(<RegionContaminationChart data={[regionSummary]} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("opens and closes the mobile navigation dialog", () => {
    render(<MobileNav />);

    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(
      screen.queryByRole("dialog", { name: "Navigation menu" })
    ).not.toBeInTheDocument();
  });
});
