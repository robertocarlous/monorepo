import React from "react";
import { BarChart3 } from "lucide-react";

interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChartEmptyState({
  title = "No data available",
  description = "No data for this period. Try adjusting your filters or date range.",
  icon,
}: ChartEmptyStateProps) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center border-2 border-dashed border-foreground/30 font-mono text-sm text-muted-foreground p-6 text-center"
      role="status"
      aria-label={title}
    >
      {icon ?? (
        <BarChart3 className="w-8 h-8 mb-2 text-muted-foreground/50" aria-hidden="true" />
      )}
      <p className="font-bold text-foreground/70 mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
