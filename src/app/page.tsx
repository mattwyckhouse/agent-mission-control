import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientAgentGrid } from "@/components/cards/ClientAgentGrid";
import { MetricCard } from "@/components/cards/MetricCard";
import { ActivityList } from "@/components/data/ActivityList";
import type { Agent } from "@/types";
import { Users, Zap, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

// Map activity types to display types
function mapActivityType(activityType: string): "success" | "info" | "warning" | "error" {
  switch (activityType) {
    case "task_completed":
      return "success";
    case "agent_status_change":
    case "task_created":
    case "task_updated":
      return "info";
    case "system_event":
      return "warning";
    default:
      return "info";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Define activity row type with joined agent
  type ActivityWithAgent = {
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    agent_id: string | null;
    created_at: string;
    agents: { display_name: string } | null;
  };

  // Fetch agents and activities in parallel
  const [agentsResult, activitiesResult] = await Promise.all([
    supabase.from("agents").select("*").order("name").returns<Agent[]>(),
    supabase
      .from("activities")
      .select("id, activity_type, title, description, agent_id, created_at, agents(display_name)")
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ActivityWithAgent[]>(),
  ]);

  const { data: agents, error } = agentsResult;
  const { data: rawActivities } = activitiesResult;

  // Transform activities to ActivityItem format
  const activities = (rawActivities || []).map((activity) => ({
    id: activity.id,
    timestamp: activity.created_at,
    agentId: activity.agent_id || undefined,
    agentName: activity.agents?.display_name || undefined,
    type: mapActivityType(activity.activity_type),
    message: activity.title,
    details: activity.description || undefined,
  }));

  if (error) {
    return (
      <AppShell>
        <PageHeader 
          title="Squad Status" 
          subtitle="Error loading dashboard"
        />
        <div className="p-8 rounded-xl bg-error/10 border border-error/30">
          <h2 className="text-lg font-semibold text-error mb-2">Error loading agents</h2>
          <pre className="text-sm text-muted-foreground font-mono">{error.message}</pre>
        </div>
      </AppShell>
    );
  }

  // Calculate stats
  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter((a) => a.status === "online" || a.status === "busy").length || 0;
  const busyAgents = agents?.filter((a) => a.status === "busy").length || 0;
  const errorAgents = agents?.filter((a) => a.status === "error").length || 0;

  // Format current timestamp
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader 
        title="Squad Status" 
        timestamp={timestamp}
      />

      {/* Quick Stats Row */}
      <section className="mb-8">
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
        <ClientAgentGrid agents={agents || []} />
      </section>

      {/* Recent Activity Section */}
      <section className="mt-8">
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
        <div className="p-4 rounded-xl bg-card/40 border border-border">
          <ActivityList 
            activities={activities}
            maxItems={5}
            showViewAll={activities.length > 5}
          />
        </div>
      </section>
    </AppShell>
  );
}
