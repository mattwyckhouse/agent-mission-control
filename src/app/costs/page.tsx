/**
 * Costs Page — Cost Tracker
 * 
 * Displays token usage and costs by agent with charts and breakdowns.
 */

"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/cards/GlassCard";
import { MetricCard } from "@/components/cards/MetricCard";
import { CostBarChart, TokenBarChart, type BarChartItem } from "@/components/data/BarChart";
import { DataTable, type Column } from "@/components/data/DataTable";
import { SparklineChart } from "@/components/data/SparklineChart";
import { getAgentMetrics, getAgentDailyCosts, getAllAgentsSummary } from "@/lib/agent-metrics";
import { DollarSign, Coins, Activity, TrendingUp, TrendingDown } from "lucide-react";

// All agent IDs we track
const AGENT_IDS = [
  "klaus", "iris", "atlas", "oracle", "sentinel", "herald",
  "forge", "aegis", "codex", "pixel", "pathfinder", "curator", "steward"
];

const AGENT_NAMES: Record<string, { name: string; emoji: string }> = {
  klaus: { name: "Klaus", emoji: "🎯" },
  iris: { name: "Iris", emoji: "📧" },
  atlas: { name: "Atlas", emoji: "📅" },
  oracle: { name: "Oracle", emoji: "🔮" },
  sentinel: { name: "Sentinel", emoji: "📊" },
  herald: { name: "Herald", emoji: "📢" },
  forge: { name: "Forge", emoji: "🔨" },
  aegis: { name: "Aegis", emoji: "🛡️" },
  codex: { name: "Codex", emoji: "📚" },
  pixel: { name: "Pixel", emoji: "🎨" },
  pathfinder: { name: "Pathfinder", emoji: "🧭" },
  curator: { name: "Curator", emoji: "🎁" },
  steward: { name: "Steward", emoji: "🏠" },
};

// Table row type
interface CostRow {
  agent: string;
  emoji: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

const columns: Column<CostRow>[] = [
  {
    key: "agent",
    header: "Agent",
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <span>{row.emoji}</span>
        <span className="font-medium">{row.agent}</span>
      </div>
    ),
  },
  {
    key: "runs",
    header: "Runs",
    sortable: true,
    align: "right",
  },
  {
    key: "inputTokens",
    header: "Input",
    sortable: true,
    align: "right",
    render: (row) => row.inputTokens.toLocaleString(),
  },
  {
    key: "outputTokens",
    header: "Output",
    sortable: true,
    align: "right",
    render: (row) => row.outputTokens.toLocaleString(),
  },
  {
    key: "totalTokens",
    header: "Total Tokens",
    sortable: true,
    align: "right",
    render: (row) => row.totalTokens.toLocaleString(),
  },
  {
    key: "cost",
    header: "Cost",
    sortable: true,
    align: "right",
    render: (row) => `$${row.cost.toFixed(2)}`,
    getValue: (row) => row.cost,
  },
];

export default function CostsPage() {
  // Calculate all metrics using the agent-metrics library
  const { agentData, summary, costByAgent, tokensByAgent, dailyTotals, tableData } = useMemo(() => {
    // Get metrics for all agents
    const agentData = AGENT_IDS.map(id => ({
      id,
      ...AGENT_NAMES[id],
      metrics: getAgentMetrics(id),
      dailyCosts: getAgentDailyCosts(id),
    }));

    // Summary stats
    const summary = getAllAgentsSummary();
    
    // Calculate week total from daily data
    const weekCost = agentData.reduce((sum, agent) => {
      return sum + agent.dailyCosts.reduce((daySum, day) => daySum + day.value, 0);
    }, 0);

    // Cost by agent (sorted, top 6)
    const costByAgent: BarChartItem[] = agentData
      .map(a => ({ label: a.name, value: a.metrics.cost }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Tokens by agent (sorted, top 6)
    const tokensByAgent: BarChartItem[] = agentData
      .map(a => ({ label: a.name, value: a.metrics.totalTokens }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Daily totals for sparkline (aggregate all agents)
    const dailyTotals: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayTotal = agentData.reduce((sum, agent) => {
        return sum + (agent.dailyCosts[i]?.value || 0);
      }, 0);
      dailyTotals.push(Math.round(dayTotal * 100) / 100);
    }

    // Table data
    const tableData: CostRow[] = agentData.map(a => ({
      agent: a.name,
      emoji: a.emoji,
      runs: a.metrics.runs,
      inputTokens: a.metrics.inputTokens,
      outputTokens: a.metrics.outputTokens,
      totalTokens: a.metrics.totalTokens,
      cost: a.metrics.cost,
    }));

    return {
      agentData,
      summary: { ...summary, weekCost },
      costByAgent,
      tokensByAgent,
      dailyTotals,
      tableData,
    };
  }, []);

  // Calculate trend
  const costTrend = dailyTotals.length >= 2 
    ? ((dailyTotals[6] - dailyTotals[5]) / dailyTotals[5] * 100) 
    : 0;
  const costTrendDirection = costTrend > 2 ? "up" : costTrend < -2 ? "down" : "neutral";

  // Generate date labels
  const dateLabels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <AppShell>
      <PageHeader
        title="Cost Tracker"
        subtitle="Monitor token usage and costs across agents"
      />

      {/* Summary Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          value={`$${summary.totalCost.toFixed(2)}`}
          label="Today"
          trend={{
            direction: costTrendDirection === "down" ? "down" : "up",
            value: `${Math.abs(costTrend).toFixed(0)}% vs yesterday`,
          }}
          icon={<DollarSign className="h-5 w-5" />}
          variant={costTrendDirection === "down" ? "success" : costTrendDirection === "up" ? "warning" : "default"}
        />
        <MetricCard
          value={`$${summary.weekCost.toFixed(2)}`}
          label="This Week"
          icon={costTrend > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          variant="teal"
        />
        <MetricCard
          value={summary.totalTokens.toLocaleString()}
          label="Tokens Today"
          icon={<Coins className="h-5 w-5" />}
        />
        <MetricCard
          value={summary.totalRuns.toString()}
          label="Runs Today"
          icon={<Activity className="h-5 w-5" />}
          variant="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Cost by Agent */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cost by Agent (Today)
          </h3>
          <CostBarChart data={costByAgent} />
        </GlassCard>

        {/* Tokens by Agent */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tokens by Agent (Today)
          </h3>
          <TokenBarChart data={tokensByAgent} />
        </GlassCard>
      </div>

      {/* Weekly Trend */}
      <GlassCard className="mb-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Daily Cost Trend (Last 7 Days)
        </h3>
        <SparklineChart
          data={dailyTotals}
          height={80}
          showArea={true}
          showMinMax={true}
          showDots={true}
          labels={[dateLabels[0], dateLabels[3], dateLabels[6]]}
        />
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-error" />
            Min: ${Math.min(...dailyTotals).toFixed(2)}
          </span>
          <span>Avg: ${(dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length).toFixed(2)}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Max: ${Math.max(...dailyTotals).toFixed(2)}
          </span>
        </div>
      </GlassCard>

      {/* Detailed Table */}
      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Detailed Breakdown
        </h3>
        <DataTable
          data={tableData}
          columns={columns}
          rowKey="agent"
        />
      </GlassCard>
    </AppShell>
  );
}
