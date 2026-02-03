import Link from "next/link"
import { ArrowLeft, Zap, DollarSign, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { mapAgentStatusToUI } from "@/types"
import type { Agent } from "@/types"
import { GlassCard } from "@/components/cards/GlassCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/Button"
import { Timeline, type TimelineItem } from "@/components/data/Timeline"
import { CostSparkline } from "@/components/data/SparklineChart"
import { AgentControlPanel } from "@/components/agents/AgentControlPanel"

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
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <GlassCard variant="glass-2" className="p-8 text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-2">Agent Not Found</h1>
          <p className="text-text-secondary mb-4">No agent with ID &quot;{id}&quot; exists.</p>
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

  // Mock cost data for now - TODO: implement real cost tracking
  const agentCost = { runs: 0, totalTokens: 0, cost: 0 }
  
  // Mock performance stats
  const performanceStats = {
    avgResponse: "12.4s",
    successRate: "98.2%",
    tokensPerRun: agentCost ? Math.floor(agentCost.totalTokens / Math.max(agentCost.runs, 1)).toLocaleString() : "0",
    costTrend: "+15%",
  }

  // Mock daily costs for sparkline (deterministic values)
  const dailyCostValues = [1.2, 0.8, 1.5, 1.1, 2.0, 1.7, 1.4]
  const dailyCosts = dailyCostValues.map((value, i) => ({
    date: `Day ${i + 1}`,
    value,
  }))

  // Calculate uptime from last heartbeat
  const lastHeartbeat = agent.last_heartbeat
    ? formatTimeAgo(new Date(agent.last_heartbeat))
    : "Never"

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
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
              <div className="w-16 h-16 rounded-xl bg-bg-elevated border border-white/10 flex items-center justify-center text-3xl">
                {agent.emoji}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">
                  {agent.display_name}
                </h1>
                <p className="text-text-secondary">{agent.domain}</p>
              </div>
            </div>

            {/* Status Info */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Status</p>
                <StatusBadge status={uiStatus} />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Session</p>
                <p className="text-sm text-text-secondary font-mono truncate">
                  {agent.session_key}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Last Heartbeat</p>
                <p className="text-sm text-text-primary">{lastHeartbeat}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Current Task</p>
                <p className="text-sm text-text-primary truncate">
                  {agent.current_task_id || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Today Stats */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Today</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {agentCost?.runs || 0}
                  </p>
                  <p className="text-xs text-text-muted">Runs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {agentCost?.totalTokens.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-text-muted">Tokens</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    ${agentCost?.cost.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-text-muted">Cost</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Controls */}
          <div className="mt-6 pt-6 border-t border-white/5">
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
            <h2 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-4">
              Activity Timeline
            </h2>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} maxItems={8} />
            ) : (
              <p className="text-text-muted text-sm">No recent activity</p>
            )}
          </GlassCard>

          {/* Performance Stats */}
          <GlassCard variant="glass-1" className="p-6">
            <h2 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-4">
              Performance (7 days)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted">Avg Response</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {performanceStats.avgResponse}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Success Rate</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {performanceStats.successRate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Tokens/Run</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {performanceStats.tokensPerRun}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Cost Trend</p>
                  <p className="text-lg font-semibold text-brand-orange">
                    {performanceStats.costTrend}
                  </p>
                </div>
              </div>

              {/* Sparkline */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-text-muted mb-2">Cost Trend</p>
                <CostSparkline
                  data={dailyCosts.map(d => d.value)}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Output */}
        <GlassCard variant="glass-1" className="p-6">
          <h2 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-4">
            Recent Output
          </h2>
          <div className="bg-bg-base rounded-lg border border-white/5 p-4 overflow-x-auto">
            <pre className="text-sm text-text-secondary font-mono">
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
