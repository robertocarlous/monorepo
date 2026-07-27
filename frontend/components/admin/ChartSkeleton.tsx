import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function KPICardSkeleton() {
  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between h-40"
      role="status"
      aria-label="Loading KPI card"
    >
      <div>
        <Skeleton className="h-4 w-24 mb-2 border-2 border-foreground/10" />
        <Skeleton className="h-8 w-32 border-2 border-foreground/10" />
      </div>
      <div className="flex items-end justify-between mt-4">
        <Skeleton className="h-4 w-28 border-2 border-foreground/10" />
        <Skeleton className="h-12 w-28 border-2 border-foreground/10" />
      </div>
    </div>
  );
}

export function BarChartSkeleton() {
  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col h-[360px]"
      role="status"
      aria-label="Loading chart"
    >
      <Skeleton className="h-6 w-48 mb-1 border-2 border-foreground/10" />
      <Skeleton className="h-3 w-64 mb-4 border-2 border-foreground/10" />
      <div className="flex-1 flex items-end gap-3 px-4 pb-6">
        {[40, 65, 50, 80, 30].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 border-2 border-foreground/10"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AreaChartSkeleton() {
  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col h-[360px]"
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <Skeleton className="h-6 w-48 mb-1 border-2 border-foreground/10" />
          <Skeleton className="h-3 w-56 border-2 border-foreground/10" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
          <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
          <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <Skeleton className="absolute inset-0 border-2 border-foreground/10" />
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,180 Q50,160 100,140 T200,100 T300,60 T400,40 L400,200 L0,200 Z"
            fill="currentColor"
            className="text-muted/40"
          />
          <path
            d="M0,180 Q50,160 100,140 T200,100 T300,60 T400,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/20"
          />
        </svg>
      </div>
    </div>
  );
}

export function QualityMetricSkeleton() {
  return (
    <div className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 border-2 border-foreground/10" />
        <div>
          <Skeleton className="h-3 w-28 mb-2 border-2 border-foreground/10" />
          <Skeleton className="h-7 w-20 border-2 border-foreground/10" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mt-4 border-2 border-foreground/10" />
    </div>
  );
}
