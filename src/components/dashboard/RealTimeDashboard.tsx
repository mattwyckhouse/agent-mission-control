"use client";

import { useAgentsSubscription } from "@/hooks/useAgentsSubscription";
import { useActivitiesSubscription } from "@/hooks/useActivitiesSubscription";
import { ClientAgentGrid } from "@/components/cards/ClientAgentGrid";
import { ActivityList } from "@/components/data/ActivityList";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { MetricCard } from "@/components/cards/MetricCard";
import { Users, Zap, Activity } from "lucide-react";
import type { Agent } from "@/types";

interface ActivityItem {
  id: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  type: "success" | "info" | "warning" | "error";
  message: string;
  details?: string;
}

interface RealTimeDashboardProps {
  /** Initial agents from server */
  initialAgents: Agent[];
  /** Initial activities from server */
  initialActivities: ActivityItem[];
}

/**
 * RealTimeDashboard - Client component with live updates
 * 
 * Wraps the dashboard with real-time subscriptions for:
 * - Agent status changes
 * - Activity feed updates
 * 
 * Shows connection status indicator.
 */
export function RealTimeDashboard({
  initialAgents,
  initialActivities,
}: RealTimeDashboardProps) {
  // Subscribe to agents with initial data from server
  const {
    agents,
    status: agentsStatus,
  } = useAgentsSubscription({
    initialData: initialAgents,
  });

  // Subscribe to activities
  const {
    activities: rawActivities,
    status: activitiesStatus,
  } = useActivitiesSubscription({
    initialData: initialActivities.map((a) => ({
      id: a.id,
      activity_type: a.type,
      title: a.message,
      description: a.details || null,
      agent_id: a.agentId || null,
      task_id: null,
      message_id: null,
      metadata: null,
      created_at: a.timestamp,
    })),
    limit: 10,
  });

  // Transform activities back to ActivityItem format for ActivityList
  const activities: ActivityItem[] = rawActivities.map((a) => ({
    id: a.id,
    timestamp: a.created_at,
    agentId: a.agent_id || undefined,
    type: mapActivityType(a.activity_type),
    message: a.title,
    details: a.description || undefined,
  }));

  // Calculate stats from live agents
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "online" || a.status === "busy").length;
  const busyAgents = agents.filter((a) => a.status === "busy").length;
  const errorAgents = agents.filter((a) => a.status === "error").length;

  // Connection status (use worst of the two)
  const connectionStatus = getWorstStatus(agentsStatus, activitiesStatus);

  return (
    <div className="space-y-8">
      {/* Connection Status - show in top right */}
      <div className="flex justify-end">
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Quick Stats Row */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            value={totalAgents}
            label="Total Agents"
            icon={<Users className="w-5 h-5" />}
            variant="teal"
          />
          <MetricCard
            value={activeAgents}
            label="Online"
            icon={<Zap className="w-5 h-5" />}
            variant="success"
            trend={activeAgents > 0 ? {
              direction: "up",
              value: `${activeAgents} active`,
            } : undefined}
          />
          <MetricCard
            value={busyAgents}
            label="Working"
            icon={<Activity className="w-5 h-5" />}
            variant="orange"
          />
          <MetricCard
            value={errorAgents}
            label="Errors"
            icon={<Activity className="w-5 h-5" />}
            variant={errorAgents > 0 ? "warning" : "default"}
            trend={errorAgents > 0 ? {
              direction: "down",
              value: "Needs attention",
            } : undefined}
          />
        </div>
      </section>

      {/* Agent Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Agent Squad</h2>
          <p className="text-sm text-muted-foreground">
            {activeAgents} of {totalAgents} online
          </p>
        </div>
        <ClientAgentGrid agents={agents} />
      </section>

      {/* Recent Activity Section */}
      <section>
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
        <div className="p-4 rounded-xl bg-card/40 border border-border">
          <ActivityList 
            activities={activities}
            maxItems={5}
            showViewAll={activities.length > 5}
          />
        </div>
      </section>
    </div>
  );
}

// Helper to map activity types
function mapActivityType(activityType: string): "success" | "info" | "warning" | "error" {
  switch (activityType) {
    case "task_completed":
    case "success":
      return "success";
    case "agent_status_change":
    case "task_created":
    case "task_updated":
    case "info":
      return "info";
    case "system_event":
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "info";
  }
}

// Helper to get worst connection status
function getWorstStatus(
  ...statuses: Array<"connected" | "connecting" | "error" | "disconnected">
): "connected" | "connecting" | "error" | "disconnected" {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("disconnected")) return "disconnected";
  if (statuses.includes("connecting")) return "connecting";
  return "connected";
}

export default RealTimeDashboard;
