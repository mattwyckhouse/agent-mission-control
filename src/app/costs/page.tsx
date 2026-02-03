/**
 * Costs Page — Cost Tracker
 * 
 * Displays token usage and costs by agent with charts and breakdowns.
 */

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/cards/GlassCard";
import { MetricCard } from "@/components/cards/MetricCard";
import { CostBarChart, TokenBarChart, type BarChartItem } from "@/components/data/BarChart";
import { DataTable, type Column } from "@/components/data/DataTable";
import { SparklineChart } from "@/components/data/SparklineChart";
import { mockCostData, mockDailyCosts, mockAgents } from "@/lib/mock-data";
import { DollarSign, Coins, Activity, TrendingUp } from "lucide-react";

// Calculate summary stats
function getCostSummary() {
  const today = mockCostData;
  const totalCost = today.reduce((sum, d) => sum + d.cost, 0);
  const totalTokens = today.reduce((sum, d) => sum + d.totalTokens, 0);
  const totalRuns = today.reduce((sum, d) => sum + d.runs, 0);

  // Week totals from daily costs
  const weekCost = mockDailyCosts.reduce((sum, d) => sum + d.totalCost, 0);

  // Previous week comparison (mock -15%)
  const costChange = -15;

  return {
    todayCost: totalCost,
    weekCost,
    totalTokens,
    totalRuns,
    costChange,
  };
}

// Prepare bar chart data
function getCostByAgent(): BarChartItem[] {
  return mockCostData
    .map((d) => ({
      label: d.agentName,
      value: d.cost,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6
}

function getTokensByAgent(): BarChartItem[] {
  return mockCostData
    .map((d) => ({
      label: d.agentName,
      value: d.totalTokens,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6
}

// Get sparkline data (daily costs)
function getDailySparkline(): number[] {
  return mockDailyCosts.map((d) => d.totalCost);
}

// Table columns
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

// Prepare table data
function getTableData(): CostRow[] {
  return mockCostData.map((d) => {
    const agent = mockAgents.find((a) => a.id === d.agentId);
    return {
      agent: d.agentName,
      emoji: agent?.emoji ?? "🤖",
      runs: d.runs,
      inputTokens: d.inputTokens,
      outputTokens: d.outputTokens,
      totalTokens: d.totalTokens,
      cost: d.cost,
    };
  });
}

export default function CostsPage() {
  const summary = getCostSummary();
  const costByAgent = getCostByAgent();
  const tokensByAgent = getTokensByAgent();
  const dailyData = getDailySparkline();
  const tableData = getTableData();

  // Generate date labels for sparkline
  const dateLabels = mockDailyCosts.map((d) => {
    const date = new Date(d.date);
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
          value={`$${summary.todayCost.toFixed(2)}`}
          label="Today"
          trend={{
            direction: summary.costChange < 0 ? "down" : "up",
            value: `${Math.abs(summary.costChange)}% vs yesterday`,
          }}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          value={`$${summary.weekCost.toFixed(2)}`}
          label="This Week"
          icon={<TrendingUp className="h-5 w-5" />}
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
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Cost by Agent */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Cost by Agent (Today)
          </h3>
          <CostBarChart data={costByAgent} />
        </GlassCard>

        {/* Tokens by Agent */}
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Tokens by Agent (Today)
          </h3>
          <TokenBarChart data={tokensByAgent} />
        </GlassCard>
      </div>

      {/* Weekly Trend */}
      <GlassCard className="mb-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Daily Cost Trend (Last 7 Days)
        </h3>
        <SparklineChart
          data={dailyData}
          height={60}
          showArea={true}
          showMinMax={true}
          labels={[dateLabels[0], dateLabels[dateLabels.length - 1]]}
        />
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          <span>Min: ${Math.min(...dailyData).toFixed(2)}</span>
          <span>Avg: ${(dailyData.reduce((a, b) => a + b, 0) / dailyData.length).toFixed(2)}</span>
          <span>Max: ${Math.max(...dailyData).toFixed(2)}</span>
        </div>
      </GlassCard>

      {/* Detailed Table */}
      <GlassCard>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
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
