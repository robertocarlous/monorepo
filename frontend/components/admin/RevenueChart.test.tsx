import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RevenueChart } from "./RevenueChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("RevenueChart", () => {
  it("renders loading skeleton when isLoading is true", () => {
    render(<RevenueChart isLoading />);
    expect(screen.getByRole("status", { name: /loading chart/i })).toBeInTheDocument();
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(<RevenueChart error onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no data", () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByText("No revenue recorded in this timeframe")).toBeInTheDocument();
  });

  it("renders chart with revenue data", () => {
    render(
      <RevenueChart
        data={[
          { date: "2026-05-01", feeType: "platform_fee", amount: 50000 },
          { date: "2026-05-01", feeType: "underwriting_fee", amount: 30000 },
        ]}
      />,
    );
    expect(screen.getByText("Platform Revenue")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("has accessible figure with aria-label", () => {
    render(
      <RevenueChart
        data={[
          { date: "2026-05-01", feeType: "platform_fee", amount: 50000 },
        ]}
      />,
    );
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("Platform Revenue"));
  });

  it("includes screen-reader data table for revenue data", () => {
    render(
      <RevenueChart
        data={[
          { date: "2026-05-01", feeType: "platform_fee", amount: 50000 },
          { date: "2026-05-01", feeType: "underwriting_fee", amount: 30000 },
        ]}
      />,
    );
    const table = screen.getByRole("table", { name: /revenue timeline data/i });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Date" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Platform Fee" })).toBeInTheDocument();
  });

  it("renders time range selector buttons", () => {
    render(<RevenueChart />);
    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90d" })).toBeInTheDocument();
  });
});
