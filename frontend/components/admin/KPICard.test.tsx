import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "./KPICard";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));

describe("KPICard", () => {
  it("renders loading skeleton when isLoading is true", () => {
    render(<KPICard title="Test KPI" value={100} isLoading />);
    expect(screen.getByRole("status", { name: /loading kpi card/i })).toBeInTheDocument();
  });

  it("renders KPI content when loaded", () => {
    render(<KPICard title="Total Users" value={1500} />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("has accessible region with aria-label", () => {
    render(<KPICard title="Revenue" value="₦5M" change={12.4} changeLabel="vs last month" />);
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-label", expect.stringContaining("Revenue"));
    expect(region).toHaveAttribute("aria-label", expect.stringContaining("up 12.4%"));
  });

  it("shows change indicator for positive change", () => {
    render(<KPICard title="Growth" value="85%" change={5.2} />);
    expect(screen.getByText("+5.2%")).toBeInTheDocument();
  });

  it("shows change indicator for negative change", () => {
    render(<KPICard title="Default Rate" value="3.1%" change={-2.1} />);
    expect(screen.getByText("-2.1%")).toBeInTheDocument();
  });

  it("shows fallback text when no change value", () => {
    render(<KPICard title="Static" value={42} />);
    expect(screen.getByText("Live updates active")).toBeInTheDocument();
  });
});
