"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { AreaChartSkeleton } from "./ChartSkeleton";
import { ChartEmptyState } from "./ChartEmptyState";
import { ChartErrorState } from "./ChartErrorState";

export interface RevenueTimelineItem {
  date: string;
  feeType: string;
  amount: number;
}

export interface RevenueChartProps {
  data?: RevenueTimelineItem[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRangeChange?: (range: "7d" | "30d" | "90d") => void;
}

// Format full values for tooltip display
const formatFullCurrency = (val: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(val);
};

// Format date labels
const formatDateLabel = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

// Custom Neobrutalist Tooltip — declared at module level to avoid creating during render
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const platformFee = payload.find((p: any) => p.name === "Platform Fee")?.value || 0;
    const underwritingFee = payload.find((p: any) => p.name === "Underwriting Fee")?.value || 0;
    const total = platformFee + underwritingFee;

    return (
      <div className="border-3 border-foreground bg-white text-black p-3 font-mono text-xs shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
        <p className="font-bold border-b-2 border-foreground pb-1 mb-1.5">{formatDateLabel(label)}</p>
        <p className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary border border-foreground inline-block"></span>
            Platform Fee:
          </span>
          <span className="font-bold">{formatFullCurrency(platformFee)}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-500 border border-foreground inline-block"></span>
            Underwriting:
          </span>
          <span className="font-bold">{formatFullCurrency(underwritingFee)}</span>
        </p>
        <p className="flex justify-between gap-4 border-t border-dashed border-foreground/30 mt-1.5 pt-1.5 font-bold">
          <span>Total Revenue:</span>
          <span className="font-black text-black">{formatFullCurrency(total)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({
  data = [],
  isLoading = false,
  error = false,
  onRetry,
  onRangeChange,
}: RevenueChartProps) {
  const [activeRange, setActiveRange] = useState<"7d" | "30d" | "90d">("30d");

  const handleRangeChange = (range: "7d" | "30d" | "90d") => {
    setActiveRange(range);
    if (onRangeChange) {
      onRangeChange(range);
    }
  };

  // Pivot the flat list of records by date:
  // e.g. [{ date: '2026-05-01', feeType: 'platform_fee', amount: 50000 }]
  // => [{ date: '2026-05-01', 'Platform Fee': 50000, 'Underwriting Fee': 0, total: 50000 }]
  const pivotedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const dayMap = new Map<string, Record<string, any>>();
    
    data.forEach((item) => {
      if (!dayMap.has(item.date)) {
        dayMap.set(item.date, {
          date: item.date,
          "Platform Fee": 0,
          "Underwriting Fee": 0,
          total: 0,
        });
      }
      
      const record = dayMap.get(item.date)!;
      const cleanType =
        item.feeType === "platform_fee"
          ? "Platform Fee"
          : item.feeType === "underwriting_fee"
            ? "Underwriting Fee"
            : "Platform Fee"; // fallback
      
      record[cleanType] += item.amount;
      record.total += item.amount;
    });

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  // Format currency values nicely (in NGN)
  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) {
      return `₦${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `₦${(val / 1_000).toFixed(0)}K`;
    }
    return `₦${val}`;
  };

  if (isLoading) {
    return <AreaChartSkeleton />;
  }

  if (error) {
    return (
      <div className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] h-[360px]">
        <ChartErrorState onRetry={onRetry} />
      </div>
    );
  }

  const totalRevenue = pivotedData.reduce((sum, d) => sum + (d.total || 0), 0);

  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between h-[360px] transition-all hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5"
      role="figure"
      aria-label={`Platform Revenue chart. Total revenue: ${formatFullCurrency(totalRevenue)} over ${pivotedData.length} days.`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-mono text-lg font-black uppercase tracking-tight">Platform Revenue</h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            MTD Platform share from leases and premium options
          </p>
        </div>
        {/* Segmented Timeframe Selectors */}
        <div className="flex border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] overflow-hidden">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`font-mono text-[10px] font-bold uppercase py-1 px-3 transition-colors border-r-2 last:border-r-0 border-foreground ${
                activeRange === r
                  ? "bg-primary text-black"
                  : "bg-white text-foreground hover:bg-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {pivotedData.length === 0 ? (
          <ChartEmptyState
            title="No revenue recorded in this timeframe"
            description="No revenue entries found for the selected period. Try a different date range."
            icon={<TrendingUp className="w-8 h-8 mb-2 text-muted-foreground/50" aria-hidden="true" />}
          />
        ) : (
          <>
            {/* Screen-reader accessible data table fallback */}
            <table className="sr-only" aria-label="Revenue timeline data">
              <caption>Daily revenue breakdown by fee type</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Platform Fee</th>
                  <th scope="col">Underwriting Fee</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {pivotedData.map((row) => (
                  <tr key={row.date}>
                    <td>{formatDateLabel(row.date)}</td>
                    <td>{formatFullCurrency(row["Platform Fee"])}</td>
                    <td>{formatFullCurrency(row["Underwriting Fee"])}</td>
                    <td>{formatFullCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={pivotedData}
              margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUnderwriting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="4"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickFormatter={formatDateLabel}
                tick={{ fill: "#000000", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickFormatter={formatCurrency}
                tick={{ fill: "#000000", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" }}
              />
              <Tooltip content={CustomTooltip} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="rect"
                formatter={(value) => (
                  <span className="font-mono text-[11px] font-bold text-black uppercase">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="Platform Fee"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPlatform)"
              />
              <Area
                type="monotone"
                dataKey="Underwriting Fee"
                stroke="#22c55e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorUnderwriting)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
