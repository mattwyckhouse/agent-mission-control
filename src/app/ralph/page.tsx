"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { RalphPhases } from "@/components/ralph/RalphPhases";
import { RalphProgress } from "@/components/ralph/RalphProgress";
import { LiveOutput } from "@/components/ralph/LiveOutput";
import { LoopCard, LoopCardCompact } from "@/components/ralph/LoopCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Play, Pause, RefreshCw, History, Zap } from "lucide-react";
import type { RalphLoop } from "@/types";

// Mock data - will be replaced with Supabase integration
import { mockRalphLoops } from "@/lib/mock-data";

// Generate some historical completed loops for demo
const completedLoops: RalphLoop[] = [
  {
    id: "ralph-setup-1",
    buildId: "initial-setup",
    name: "Initial Project Setup",
    agent: "forge",
    phase: "done",
    currentStep: 12,
    totalSteps: 12,
    startedAt: "2026-02-01T10:00:00Z",
    lastUpdate: "2026-02-01T11:30:00Z",
    tokensUsed: 18500,
    cost: 0.93,
    output: [],
  },
  {
    id: "ralph-design-1",
    buildId: "design-system",
    name: "Design System Components",
    agent: "forge",
    phase: "done",
    currentStep: 8,
    totalSteps: 8,
    startedAt: "2026-02-01T14:00:00Z",
    lastUpdate: "2026-02-01T14:45:00Z",
    tokensUsed: 12000,
    cost: 0.60,
    output: [],
  },
  {
    id: "ralph-blocked-1",
    buildId: "api-integration",
    name: "API Integration (Blocked)",
    agent: "forge",
    phase: "blocked",
    currentStep: 5,
    totalSteps: 15,
    startedAt: "2026-02-02T09:00:00Z",
    lastUpdate: "2026-02-02T09:30:00Z",
    tokensUsed: 8500,
    cost: 0.43,
    output: [
      { timestamp: "2026-02-02T09:30:00Z", type: "error", message: "Missing SUPABASE_URL environment variable" },
    ],
  },
];

export default function RalphPage() {
  const [activeLoop, setActiveLoop] = useState<RalphLoop | null>(
    mockRalphLoops[0] || null
  );
  const [historicalLoops, setHistoricalLoops] = useState<RalphLoop[]>(completedLoops);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Simulate live updates for the active loop
  useEffect(() => {
    if (!activeLoop || activeLoop.phase === "done" || activeLoop.phase === "blocked") {
      return;
    }

    const interval = setInterval(() => {
      setActiveLoop((prev) => {
        if (!prev) return null;
        // Simulate progress
        const newOutput = [
          ...prev.output,
          {
            timestamp: new Date().toISOString(),
            type: "info" as const,
            message: `Processing step ${prev.currentStep + 1}...`,
          },
        ];
        return {
          ...prev,
          lastUpdate: new Date().toISOString(),
          output: newOutput.slice(-20), // Keep last 20 entries
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [activeLoop?.phase]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const displayedHistory = showAllHistory
    ? historicalLoops
    : historicalLoops.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ralph Monitor"
        subtitle="Autonomous build loop status"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Active Loop Section */}
      {activeLoop ? (
        <GlassCard variant="glass-2" padding="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6 text-brand-orange" />
                  <h2 className="text-xl font-heading font-bold text-text-primary">
                    {activeLoop.name}
                  </h2>
                  <StatusBadge
                    status={
                      activeLoop.phase === "done"
                        ? "success"
                        : activeLoop.phase === "blocked"
                        ? "error"
                        : "working"
                    }
                  />
                </div>
                <p className="text-sm text-text-muted">
                  Build ID: {activeLoop.buildId} • Agent: @{activeLoop.agent}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button variant="primary" size="sm" disabled>
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              </div>
            </div>

            {/* Phase Indicator */}
            <div className="flex justify-center overflow-x-auto pb-2">
              <RalphPhases currentPhase={activeLoop.phase} />
            </div>

            {/* Progress Stats */}
            <RalphProgress
              currentStep={activeLoop.currentStep}
              totalSteps={activeLoop.totalSteps}
              tokensUsed={activeLoop.tokensUsed}
              cost={activeLoop.cost}
              startedAt={activeLoop.startedAt}
              lastUpdate={activeLoop.lastUpdate}
              estimatedCompletion={activeLoop.estimatedCompletion}
            />

            {/* Live Output */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-text-secondary mb-3">
                Live Output
              </h3>
              <LiveOutput output={activeLoop.output} maxHeight={200} autoScroll />
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard variant="glass-1" padding="lg" className="text-center">
          <div className="py-8">
            <Zap className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="text-lg font-heading font-semibold text-text-secondary mb-2">
              No Active Builds
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Ralph loops run autonomously when triggered. Check back later or
              view completed builds below.
            </p>
          </div>
        </GlassCard>
      )}

      {/* History Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-text-muted" />
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              Build History
            </h2>
            <span className="text-sm text-text-muted">
              ({historicalLoops.length} loops)
            </span>
          </div>
          {historicalLoops.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory ? "Show Less" : "View All"}
            </Button>
          )}
        </div>

        {historicalLoops.length === 0 ? (
          <GlassCard variant="glass-1" padding="md" className="text-center">
            <p className="text-sm text-text-muted py-4">
              No completed builds yet.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedHistory.map((loop) => (
              <LoopCard
                key={loop.id}
                loop={loop}
                onClick={() => {
                  // Could navigate to detail view
                  console.log("View loop:", loop.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <GlassCard variant="glass-1" padding="md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-heading font-bold text-text-primary">
              {historicalLoops.filter((l) => l.phase === "done").length + (activeLoop ? 1 : 0)}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Total Loops
            </div>
          </div>
          <div>
            <div className="text-2xl font-heading font-bold text-success">
              {historicalLoops.filter((l) => l.phase === "done").length}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Completed
            </div>
          </div>
          <div>
            <div className="text-2xl font-heading font-bold text-error">
              {historicalLoops.filter((l) => l.phase === "blocked").length}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Blocked
            </div>
          </div>
          <div>
            <div className="text-2xl font-heading font-bold text-brand-teal">
              $
              {(
                historicalLoops.reduce((sum, l) => sum + l.cost, 0) +
                (activeLoop?.cost || 0)
              ).toFixed(2)}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Total Cost
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
