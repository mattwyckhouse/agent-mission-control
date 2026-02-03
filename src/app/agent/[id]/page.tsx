import Link from "next/link"
import { ArrowLeft, Zap, DollarSign, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { mapAgentStatusToUI } from "@/types"
import type { Agent } from "@/types"
import { GlassCard } from "@/components/cards/GlassCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/Button"
import { Timeline, type TimelineItem } from "@/components/data/Timeline"
import { CostSparkline } from "@/components/data/SparklineChart"
import { AgentControlPanel } from "@/components/agents/AgentControlPanel"
import { getAgentMetrics, getAgentDailyCosts } from "@/lib/agent-metrics"

interface AgentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch agent from Supabase
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single() as { data: Agent | null; error: any }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard variant="glass-2" className="p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Agent Not Found</h1>
          <p className="text-muted-foreground mb-4">No agent with ID &quot;{id}&quot; exists.</p>
          <Link href="/">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </GlassCard>
      </div>
    )
  }

  const uiStatus = mapAgentStatusToUI(agent.status)
  
  // Fetch agent's activities from Supabase
  const { data: agentActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(10) as { data: any[] | null }
  
  // Convert to Timeline format
  const timelineItems: TimelineItem[] = (agentActivities || []).map((activity) => ({
    id: activity.id,
    timestamp: new Date(activity.created_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    description: activity.title || activity.description || "Activity",
    status: activity.activity_type === "task_completed" ? "done" 
      : activity.activity_type === "error" ? "error" 
      : "pending",
  }))

  // Get varied metrics for this specific agent
  const agentMetrics = getAgentMetrics(agent.id)
  const dailyCosts = getAgentDailyCosts(agent.id)
  
  // Performance stats from metrics
  const performanceStats = {
    avgResponse: agentMetrics.avgResponseTime,
    successRate: agentMetrics.successRate,
    tokensPerRun: agentMetrics.tokensPerRun.toLocaleString(),
    costTrend: agentMetrics.costTrend,
    costTrendDirection: agentMetrics.costTrendDirection,
  }

  // Calculate uptime from last heartbeat
  const lastHeartbeat = agent.last_heartbeat
    ? formatTimeAgo(new Date(agent.last_heartbeat))
    : "Never"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Agent Header Card */}
        <GlassCard variant="glass-2" className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar + Name */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center text-3xl">
                {agent.emoji}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {agent.display_name}
                </h1>
                <p className="text-muted-foreground">{agent.domain}</p>
              </div>
            </div>

            {/* Status Info */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge status={uiStatus} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Session</p>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {agent.session_key}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Heartbeat</p>
                <p className="text-sm text-foreground">{lastHeartbeat}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Task</p>
                <p className="text-sm text-foreground truncate">
                  {agent.current_task_id || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Today Stats */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Today</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {agentMetrics.runs}
                  </p>
                  <p className="text-xs text-muted-foreground">Runs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {agentMetrics.totalTokens.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Tokens</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    ${agentMetrics.cost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Cost</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Controls */}
          <div className="mt-6 pt-6 border-t border-border">
            <AgentControlPanel
              agentId={agent.id}
              agentName={agent.display_name}
              agentStatus={agent.status}
            />
          </div>
        </GlassCard>

        {/* Activity + Performance Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <GlassCard variant="glass-1" className="p-6">
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">
              Activity Timeline
            </h2>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} maxItems={8} />
            ) : (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            )}
          </GlassCard>

          {/* Performance Stats */}
          <GlassCard variant="glass-1" className="p-6">
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">
              Performance (7 days)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                  <p className="text-lg font-semibold text-foreground">
                    {performanceStats.avgResponse}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-semibold text-foreground">
                    {performanceStats.successRate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tokens/Run</p>
                  <p className="text-lg font-semibold text-foreground">
                    {performanceStats.tokensPerRun}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost Trend</p>
                  <div className="flex items-center gap-1">
                    {performanceStats.costTrendDirection === "up" && (
                      <TrendingUp className="w-4 h-4 text-brand-orange" />
                    )}
                    {performanceStats.costTrendDirection === "down" && (
                      <TrendingDown className="w-4 h-4 text-success" />
                    )}
                    {performanceStats.costTrendDirection === "neutral" && (
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    )}
                    <p className={`text-lg font-semibold ${
                      performanceStats.costTrendDirection === "up" ? "text-brand-orange" :
                      performanceStats.costTrendDirection === "down" ? "text-success" :
                      "text-muted-foreground"
                    }`}>
                      {performanceStats.costTrend}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Cost Trend</p>
                <CostSparkline
                  data={dailyCosts.map(d => d.value)}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Output */}
        <GlassCard variant="glass-1" className="p-6">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">
            Recent Output
          </h2>
          <div className="bg-background rounded-lg border border-border p-4 overflow-x-auto">
            <pre className="text-sm text-muted-foreground font-mono">
              <code>{`// ${agent.display_name} - Last output
{
  "agent": "${agent.id}",
  "session": "${agent.session_key}",
  "status": "${agent.status}",
  "last_heartbeat": "${agent.last_heartbeat || "never"}",
  "current_task": ${agent.current_task_id ? `"${agent.current_task_id}"` : "null"}
}`}</code>
            </pre>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm">
              Copy
            </Button>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
