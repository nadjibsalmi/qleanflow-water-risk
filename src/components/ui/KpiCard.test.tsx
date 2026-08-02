import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Droplets } from "lucide-react";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    render(<KpiCard label="Total Communities" value="500" icon={Droplets} />);
    expect(screen.getByText("Total Communities")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("renders the optional hint when provided", () => {
    render(
      <KpiCard
        label="Good Quality"
        value="74.6%"
        icon={Droplets}
        hint="Across all regions"
      />
    );
    expect(screen.getByText("Across all regions")).toBeInTheDocument();
  });

  it("omits the hint paragraph when not provided", () => {
    const { container } = render(
      <KpiCard label="Good Quality" value="74.6%" icon={Droplets} />
    );
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("applies the correct tone class for each tone variant", () => {
    const { rerender, container } = render(
      <KpiCard label="X" value="1" icon={Droplets} tone="danger" />
    );
    expect(container.querySelector(".text-danger")).toBeInTheDocument();

    rerender(<KpiCard label="X" value="1" icon={Droplets} tone="success" />);
    expect(container.querySelector(".text-success")).toBeInTheDocument();
  });
});
