import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DealFunnelChart } from "./DealFunnelChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("DealFunnelChart", () => {
  it("renders loading skeleton when isLoading is true", () => {
    render(<DealFunnelChart isLoading />);
    expect(screen.getByRole("status", { name: /loading chart/i })).toBeInTheDocument();
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(<DealFunnelChart error onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no deals", () => {
    render(<DealFunnelChart data={{ draft: 0, active: 0, at_risk: 0, completed: 0, defaulted: 0 }} />);
    expect(screen.getByText("No deal data available")).toBeInTheDocument();
  });

  it("renders chart with data", () => {
    render(
      <DealFunnelChart
        data={{ draft: 5, active: 10, at_risk: 3, completed: 20, defaulted: 2 }}
      />,
    );
    expect(screen.getByText("Deal Funnel Status")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("has accessible figure with aria-label describing data", () => {
    render(
      <DealFunnelChart
        data={{ draft: 1, active: 2, at_risk: 0, completed: 5, defaulted: 0 }}
      />,
    );
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("8 total deals"));
  });

  it("includes screen-reader data table", () => {
    render(
      <DealFunnelChart
        data={{ draft: 1, active: 2, at_risk: 3, completed: 4, defaulted: 0 }}
      />,
    );
    const table = screen.getByRole("table", { name: /deal funnel data/i });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Count" })).toBeInTheDocument();
  });
});
