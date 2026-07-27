"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Activity,
  TrendingUp,
  Percent,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Award,
} from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { KPICardSkeleton, QualityMetricSkeleton } from "@/components/admin/ChartSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";
import {
  getAnalyticsOverview,
  getDealFunnel,
  getRevenueTimeline,
  getListingQuality,
  type AnalyticsOverview,
  type DealFunnel,
  type RevenueTimelineItem,
  type ListingQualityMetrics,
} from "@/lib/adminAnalyticsApi";

const DealFunnelChart = dynamic(
  () =>
    import("@/components/admin/DealFunnelChart").then((m) => ({
      default: m.DealFunnelChart,
    })),
  {
    ssr: false,
    loading: () => <div className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col h-[360px]"><div className="h-6 w-48 bg-accent animate-pulse mb-1 border-2 border-foreground/10 rounded-md" /><div className="h-3 w-64 bg-accent animate-pulse mb-4 border-2 border-foreground/10 rounded-md" /><div className="flex-1 flex items-end gap-3 px-4 pb-6">{[40,65,50,80,30].map((h,i)=><div key={i} className="flex-1 bg-accent animate-pulse border-2 border-foreground/10 rounded-md" style={{height:`${h}%`}}/>)}</div></div>,
  },
);

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/RevenueChart").then((m) => ({
      default: m.RevenueChart,
    })),
  {
    ssr: false,
    loading: () => <div className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col h-[360px]"><div className="flex justify-between items-center mb-4"><div className="h-6 w-48 bg-accent animate-pulse border-2 border-foreground/10 rounded-md" /><div className="flex gap-1.5">{[1,2,3].map(i=><div key={i} className="h-8 w-12 bg-accent animate-pulse border-2 border-foreground/10 rounded-md" />)}</div></div><div className="flex-1 w-full bg-accent animate-pulse border-2 border-foreground/10 rounded-md" /></div>,
  },
);

export function AdminAnalyticsClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<DealFunnel | null>(null);
  const [revenue, setRevenue] = useState<RevenueTimelineItem[]>([]);
  const [quality, setQuality] = useState<ListingQualityMetrics | null>(null);
  const [revenueRange, setRevenueRange] = useState<"7d" | "30d" | "90d">("30d");

  const [funnelError, setFunnelError] = useState(false);
  const [revenueError, setRevenueError] = useState(false);
  const [qualityError, setQualityError] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [overviewRes, funnelRes, revenueRes, qualityRes] = await Promise.allSettled([
        getAnalyticsOverview(),
        getDealFunnel(),
        getRevenueTimeline(revenueRange),
        getListingQuality(),
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value.success) setOverview(overviewRes.value.data);
      if (funnelRes.status === "fulfilled" && funnelRes.value.success) {
        setFunnel(funnelRes.value.data);
        setFunnelError(false);
      } else {
        setFunnelError(true);
      }
      if (revenueRes.status === "fulfilled" && revenueRes.value.success) {
        setRevenue(revenueRes.value.data);
        setRevenueError(false);
      } else {
        setRevenueError(true);
      }
      if (qualityRes.status === "fulfilled" && qualityRes.value.success) {
        setQuality(qualityRes.value.data);
        setQualityError(false);
      } else {
        setQualityError(true);
      }
    } catch (err) {
      console.error("Error loading analytics data:", err);
      setError("Failed to load platform analytics. Please check connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRangeChange = async (range: "7d" | "30d" | "90d") => {
    setRevenueRange(range);
    setRevenueError(false);
    try {
      const revenueRes = await getRevenueTimeline(range);
      if (revenueRes.success) {
        setRevenue(revenueRes.data);
      } else {
        setRevenueError(true);
      }
    } catch (err) {
      console.error("Error fetching revenue timeline for range", range, err);
      setRevenueError(true);
    }
  };

  const handleRefreshClick = () => {
    loadData(true);
  };

  const retryFunnel = useCallback(() => {
    setFunnelError(false);
    setLoading(true);
    getDealFunnel()
      .then((res) => {
        if (res.success) { setFunnel(res.data); setFunnelError(false); }
        else { setFunnelError(true); }
      })
      .catch(() => setFunnelError(true))
      .finally(() => setLoading(false));
  }, []);

  const retryRevenue = useCallback(() => {
    setRevenueError(false);
    setLoading(true);
    getRevenueTimeline(revenueRange)
      .then((res) => {
        if (res.success) { setRevenue(res.data); setRevenueError(false); }
        else { setRevenueError(true); }
      })
      .catch(() => setRevenueError(true))
      .finally(() => setLoading(false));
  }, [revenueRange]);

  const retryQuality = useCallback(() => {
    setQualityError(false);
    setLoading(true);
    getListingQuality()
      .then((res) => {
        if (res.success) { setQuality(res.data); setQualityError(false); }
        else { setQualityError(true); }
      })
      .catch(() => setQualityError(true))
      .finally(() => setLoading(false));
  }, []);

  // Sum total users across roles
  const totalUsers = overview
    ? overview.usersByRole.tenant +
      overview.usersByRole.landlord +
      overview.usersByRole.agent +
      overview.usersByRole.admin
    : 0;

  // Format currency values
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-3 border-foreground pb-6">
        <div>
          <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-black">
            Platform Analytics
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Real-time business intelligence, financial performance, and quality metrics
          </p>
        </div>
        <button
          onClick={handleRefreshClick}
          disabled={loading || refreshing}
          className="flex items-center gap-2 border-3 border-foreground bg-primary hover:bg-primary/90 text-black px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="border-3 border-red-600 bg-red-50 text-red-900 p-4 font-mono text-sm shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Platform Users"
          value={loading ? "..." : totalUsers}
          change={12.4}
          changeLabel="vs last month"
          icon={<Users className="w-5 h-5 text-foreground" />}
          isLoading={loading}
          sparklineData={[1200, 1310, 1290, 1380, 1490, 1550, 1690, totalUsers || 1792]}
        />
        <KPICard
          title="Active Tenant Deals"
          value={loading ? "..." : overview?.activeDeals || 0}
          change={8.2}
          changeLabel="vs last month"
          icon={<Activity className="w-5 h-5 text-foreground" />}
          isLoading={loading}
          sparklineData={[25, 30, 28, 32, 38, 35, 40, overview?.activeDeals || 42]}
        />
        <KPICard
          title="Revenue (MTD)"
          value={loading ? "..." : formatCurrency(overview?.revenueMtd || 0)}
          change={14.7}
          changeLabel="vs last month"
          icon={<TrendingUp className="w-5 h-5 text-foreground" />}
          isLoading={loading}
          sparklineData={[2800000, 3100000, 2950000, 3400000, 3600000, 3500000, 3850000]}
        />
        <KPICard
          title="Tenant Default Rate"
          value={loading ? "..." : `${overview?.defaultRate || 0.0}%`}
          change={-15.3} // default rate went down (good trend)
          changeLabel="vs last month"
          icon={<Percent className="w-5 h-5 text-foreground" />}
          isLoading={loading}
          sparklineData={[4.2, 3.8, 3.5, 3.1, 2.9, 2.7, 2.5]}
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary level="section" onRetry={retryRevenue} fallback={<div className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] h-[360px]"><div className="h-full flex flex-col items-center justify-center font-mono text-sm text-muted-foreground"><AlertTriangle className="w-8 h-8 mb-2 text-red-500" /><p className="font-bold text-red-700">Chart failed to load</p><p className="text-xs text-red-600/80 mb-3">This chart encountered an error.</p></div></div>}>
          <RevenueChart
            data={revenue}
            isLoading={loading}
            error={revenueError}
            onRetry={retryRevenue}
            onRangeChange={handleRangeChange}
          />
        </ErrorBoundary>
        <ErrorBoundary level="section" onRetry={retryFunnel} fallback={<div className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] h-[360px]"><div className="h-full flex flex-col items-center justify-center font-mono text-sm text-muted-foreground"><AlertTriangle className="w-8 h-8 mb-2 text-red-500" /><p className="font-bold text-red-700">Chart failed to load</p><p className="text-xs text-red-600/80 mb-3">This chart encountered an error.</p></div></div>}>
          <DealFunnelChart data={funnel || undefined} isLoading={loading} error={funnelError} onRetry={retryFunnel} />
        </ErrorBoundary>
      </div>

      {/* Listing Quality & Operations Section */}
      <div className="space-y-4">
        <h2 className="font-mono text-xl font-black uppercase tracking-tight text-black border-b-2 border-foreground/10 pb-2">
          Operations & Listing Quality
        </h2>
        <ErrorBoundary level="section" onRetry={retryQuality} fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i=><div key={i} className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><p className="font-mono text-sm font-bold text-red-700">Section failed to load</p></div></div>)}</div>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                <QualityMetricSkeleton />
                <QualityMetricSkeleton />
                <QualityMetricSkeleton />
              </>
            ) : qualityError ? (
              <>
                <div className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#22c55e] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Inspection Pass Rate
                      </span>
                      <p className="font-mono text-sm text-red-600 mt-0.5">Failed to load</p>
                    </div>
                  </div>
                </div>
                <div className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#f59e0b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <Award className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Avg Listing Quality
                      </span>
                      <p className="font-mono text-sm text-red-600 mt-0.5">Failed to load</p>
                    </div>
                  </div>
                </div>
                <div className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#dc2626] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <AlertTriangle className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Whistleblower Reports
                      </span>
                      <p className="font-mono text-sm text-red-600 mt-0.5">Failed to load</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Inspection Pass Rate */}
                <div
                  className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5"
                  role="region"
                  aria-label={`Inspection Pass Rate: ${quality?.inspectionPassRate || 92.5}%`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#22c55e] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Inspection Pass Rate
                      </span>
                      <h4 className="font-mono text-2xl font-black mt-0.5">
                        {`${quality?.inspectionPassRate || 92.5}%`}
                      </h4>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-4 leading-relaxed">
                    Percentage of scheduled property inspections that successfully meet ShelterFlex standards.
                  </p>
                </div>

                {/* Average Quality Score */}
                <div
                  className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5"
                  role="region"
                  aria-label={`Average Listing Quality: ${quality?.averageListingScore || 88.4} out of 100`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#f59e0b] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <Award className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Avg Listing Quality
                      </span>
                      <h4 className="font-mono text-2xl font-black mt-0.5">
                        {`${quality?.averageListingScore || 88.4}/100`}
                      </h4>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-4 leading-relaxed">
                    Overall platform grading mapped dynamically from independent inspection rating scores.
                  </p>
                </div>

                {/* Whistleblower Complaint Rate */}
                <div
                  className="border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5"
                  role="region"
                  aria-label={`Whistleblower Reports: ${quality?.whistleblowerReportRate || 4.2}%`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-[#dc2626] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <AlertTriangle className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase block">
                        Whistleblower Reports
                      </span>
                      <h4 className="font-mono text-2xl font-black mt-0.5">
                        {`${quality?.whistleblowerReportRate || 4.2}%`}
                      </h4>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-4 leading-relaxed">
                    Rate of anonymous tenant complaints and severe listing quality issue reports raised.
                  </p>
                </div>
              </>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
