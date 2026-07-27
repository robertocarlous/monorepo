import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  KPICardSkeleton,
  BarChartSkeleton,
  AreaChartSkeleton,
  QualityMetricSkeleton,
} from "./ChartSkeleton";

describe("KPICardSkeleton", () => {
  it("renders with loading role and aria-label", () => {
    render(<KPICardSkeleton />);
    const el = screen.getByRole("status", { name: /loading kpi card/i });
    expect(el).toBeInTheDocument();
    expect(el.querySelector("[data-slot='skeleton']")).toBeTruthy();
  });
});

describe("BarChartSkeleton", () => {
  it("renders chart-shaped skeleton bars", () => {
    render(<BarChartSkeleton />);
    const el = screen.getByRole("status", { name: /loading chart/i });
    expect(el).toBeInTheDocument();
  });
});

describe("AreaChartSkeleton", () => {
  it("renders area chart skeleton with SVG path", () => {
    render(<AreaChartSkeleton />);
    const el = screen.getByRole("status", { name: /loading chart/i });
    expect(el).toBeInTheDocument();
    expect(el.querySelector("svg")).toBeTruthy();
  });
});

describe("QualityMetricSkeleton", () => {
  it("renders skeleton placeholder for quality metrics", () => {
    const { container } = render(<QualityMetricSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});
