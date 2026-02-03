"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { cn } from "@/lib/utils";
import type { CostData, Agent } from "@/types";

interface AgentCostBreakdownProps {
  /** Cost data by agent */
  costData: CostData[];
  /** Agent metadata for display */
  agents: Agent[];
  /** Sort order */
  sortBy?: "cost" | "tokens" | "runs";
  /** Maximum items to show */
  limit?: number;
  /** Additional class names */
  className?: string;
}

/**
 * AgentCostBreakdown - Per-agent cost breakdown with bars
 * 
 * Features:
 * - Sorted by cost/tokens/runs
 * - Visual bar representation
 * - Agent emoji and name
 * - Percentage of total
 */
export function AgentCostBreakdown({
  costData,
  agents,
  sortBy = "cost",
  limit = 8,
  className,
}: AgentCostBreakdownProps) {
  // Aggregate by agent (in case of multiple dates)
  const aggregated = useMemo(() => {
    const byAgent = new Map<string, {
      agentId: string;
      agentName: string;
      cost: number;
      tokens: number;
      runs: number;
    }>();

    for (const data of costData) {
      const existing = byAgent.get(data.agentId);
      if (existing) {
        existing.cost += data.cost;
        existing.tokens += data.totalTokens;
        existing.runs += data.runs;
      } else {
        byAgent.set(data.agentId, {
          agentId: data.agentId,
          agentName: data.agentName,
          cost: data.cost,
          tokens: data.totalTokens,
          runs: data.runs,
        });
      }
    }

    return Array.from(byAgent.values());
  }, [costData]);

  // Sort and limit
  const sorted = useMemo(() => {
    const getValue = (item: typeof aggregated[number]) => {
      switch (sortBy) {
        case "cost": return item.cost;
        case "tokens": return item.tokens;
        case "runs": return item.runs;
      }
    };

    return [...aggregated]
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, limit);
  }, [aggregated, sortBy, limit]);

  // Calculate totals for percentages
  const totals = useMemo(() => ({
    cost: aggregated.reduce((sum, a) => sum + a.cost, 0),
    tokens: aggregated.reduce((sum, a) => sum + a.tokens, 0),
    runs: aggregated.reduce((sum, a) => sum + a.runs, 0),
  }), [aggregated]);

  // Get max value for bar scaling
  const maxValue = useMemo(() => {
    if (sorted.length === 0) return 0;
    const getValue = (item: typeof sorted[number]) => {
      switch (sortBy) {
        case "cost": return item.cost;
        case "tokens": return item.tokens;
        case "runs": return item.runs;
      }
    };
    return Math.max(...sorted.map(getValue));
  }, [sorted, sortBy]);

  // Get agent metadata
  const getAgent = (agentId: string) => 
    agents.find(a => a.id === agentId);

  if (sorted.length === 0) {
    return (
      <GlassCard variant="glass-2" className={className}>
        <p className="text-sm text-muted-foreground text-center py-8">
          No cost data available
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="glass-2" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Cost by Agent
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: ${totals.cost.toFixed(2)}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((item) => {
          const agent = getAgent(item.agentId);
          const value = sortBy === "cost" ? item.cost 
            : sortBy === "tokens" ? item.tokens 
            : item.runs;
          const total = sortBy === "cost" ? totals.cost 
            : sortBy === "tokens" ? totals.tokens 
            : totals.runs;
          const percent = total > 0 ? (value / total) * 100 : 0;
          const barPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={item.agentId} className="group">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{agent?.emoji || "🤖"}</span>
                  <span className="text-sm font-medium text-foreground">
                    {item.agentName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    {percent.toFixed(1)}%
                  </span>
                  <span className="font-medium text-foreground min-w-[60px] text-right">
                    {sortBy === "cost" && `$${item.cost.toFixed(2)}`}
                    {sortBy === "tokens" && `${(item.tokens / 1000).toFixed(1)}k`}
                    {sortBy === "runs" && item.runs}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    "bg-gradient-to-r from-brand-teal to-brand-teal/70",
                    "group-hover:from-brand-teal group-hover:to-brand-orange/70"
                  )}
                  style={{ width: `${barPercent}%` }}
                />
              </div>

              {/* Detail Row (on hover) */}
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {sortBy !== "cost" && <span>${item.cost.toFixed(2)}</span>}
                {sortBy !== "tokens" && <span>{item.tokens.toLocaleString()} tokens</span>}
                {sortBy !== "runs" && <span>{item.runs} runs</span>}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export default AgentCostBreakdown;
