import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartEmptyState } from "./ChartEmptyState";
import { ChartErrorState } from "./ChartErrorState";

describe("ChartEmptyState", () => {
  it("renders default title and description", () => {
    render(<ChartEmptyState />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(screen.getByText(/No data for this period/)).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <ChartEmptyState
        title="No revenue"
        description="Try a different range."
      />,
    );
    expect(screen.getByText("No revenue")).toBeInTheDocument();
    expect(screen.getByText("Try a different range.")).toBeInTheDocument();
  });

  it("has status role for screen readers", () => {
    render(<ChartEmptyState title="Empty chart" />);
    expect(screen.getByRole("status", { name: "Empty chart" })).toBeInTheDocument();
  });
});

describe("ChartErrorState", () => {
  it("renders default error message", () => {
    render(<ChartErrorState />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ChartErrorState onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: /retry/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when no onRetry", () => {
    render(<ChartErrorState />);
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(
      <ChartErrorState title="Oops" message="Something broke." />,
    );
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getByText("Something broke.")).toBeInTheDocument();
  });
});
