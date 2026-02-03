"use client";

import { useState, useEffect, useCallback } from "react";
import type { CostData, CostSummary, DailyCost } from "@/types";

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface CostsDataState {
  summary: CostSummary | null;
  byAgent: CostData[];
  daily: DailyCost[];
  loading: boolean;
  error: string | null;
}

interface UseCostsDataOptions {
  /** Initial period */
  period?: "day" | "week" | "month";
  /** Initial date range */
  dateRange?: DateRange;
  /** Auto-refresh interval (ms, 0 = disabled) */
  refreshInterval?: number;
}

/**
 * useCostsData - Hook for fetching cost data with filters
 * 
 * Features:
 * - Period filter (day/week/month)
 * - Custom date range
 * - Auto-refresh
 * - Loading and error states
 */
export function useCostsData({
  period: initialPeriod = "week",
  dateRange: initialDateRange,
  refreshInterval = 0,
}: UseCostsDataOptions = {}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [state, setState] = useState<CostsDataState>({
    summary: null,
    byAgent: [],
    daily: [],
    loading: true,
    error: null,
  });

  const fetchCosts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ period });
      if (dateRange) {
        params.set("startDate", dateRange.startDate);
        params.set("endDate", dateRange.endDate);
      }

      const response = await fetch(`/api/costs?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch costs: ${response.statusText}`);
      }

      const data = await response.json();

      setState({
        summary: data.summary,
        byAgent: data.byAgent || [],
        daily: data.daily || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch costs",
      }));
    }
  }, [period, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchCosts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchCosts, refreshInterval]);

  // Update period
  const updatePeriod = useCallback((newPeriod: "day" | "week" | "month") => {
    setPeriod(newPeriod);
    setDateRange(undefined); // Clear custom range when changing period
  }, []);

  // Update date range
  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  return {
    ...state,
    period,
    dateRange,
    setPeriod: updatePeriod,
    setDateRange: updateDateRange,
    refresh: fetchCosts,
  };
}

export default useCostsData;
