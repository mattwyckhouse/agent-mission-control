"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { RalphPhases } from "@/components/ralph/RalphPhases";
import { RalphProgress } from "@/components/ralph/RalphProgress";
import { LiveOutput } from "@/components/ralph/LiveOutput";
import { LoopCard } from "@/components/ralph/LoopCard";
import { Button } from "@/components/ui/Button";
import { RefreshCw, History, Zap, AlertCircle } from "lucide-react";
import type { RalphLoop } from "@/types";

// API endpoint to fetch Ralph data
const RALPH_API = "/api/ralph";

interface RalphData {
  activeBuilds: RalphLoop[];
  completedBuilds: RalphLoop[];
  stats: {
    totalLoops: number;
    completed: number;
    blocked: number;
    totalCost: number;
  };
}

export default function RalphPage() {
  const [data, setData] = useState<RalphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(RALPH_API);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Ralph data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const activeLoop = data?.activeBuilds[0] || null;
  const historicalLoops = data?.completedBuilds || [];
  const displayedHistory = showAllHistory ? historicalLoops : historicalLoops.slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ralph Monitor" subtitle="Loading..." />
        <GlassCard variant="glass-2" padding="lg" className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ralph Monitor"
          subtitle="Autonomous build loop status"
          actions={
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          }
        />
        <GlassCard variant="glass-2" padding="lg" className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-error" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </GlassCard>
      </div>
    );
  }

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
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    {activeLoop.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeLoop.phase === "done" 
                      ? "bg-success/20 text-success" 
                      : activeLoop.phase === "blocked"
                      ? "bg-error/20 text-error"
                      : "bg-brand-orange/20 text-brand-orange"
                  }`}>
                    {activeLoop.phase === "done" ? "Complete" : activeLoop.phase === "blocked" ? "Blocked" : "Working"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Build ID: {activeLoop.buildId} • Agent: @{activeLoop.agent}
                </p>
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
            {activeLoop.output && activeLoop.output.length > 0 && (
              <div>
                <h3 className="text-sm font-heading font-semibold text-muted-foreground mb-3">
                  Live Output
                </h3>
                <LiveOutput output={activeLoop.output} maxHeight={200} autoScroll />
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <GlassCard variant="glass-1" padding="lg" className="text-center">
          <div className="py-8">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-heading font-semibold text-muted-foreground mb-2">
              No Active Builds
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
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
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Build History
            </h2>
            <span className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground py-4">
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
                  console.log("View loop:", loop.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data?.stats && (
        <GlassCard variant="glass-1" padding="md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-heading font-bold text-foreground">
                {data.stats.totalLoops}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Loops
              </div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-success">
                {data.stats.completed}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-error">
                {data.stats.blocked}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Blocked
              </div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-brand-teal">
                ${data.stats.totalCost.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Cost
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
