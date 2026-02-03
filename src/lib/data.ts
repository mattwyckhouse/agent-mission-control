/**
 * Mission Control Dashboard — Data Utilities
 * 
 * Functions for fetching and processing dashboard data.
 * Currently uses mock data; will be replaced with Supabase queries.
 */

import { createClient } from "@/lib/supabase/server";
import {
  mockAgents,
  mockRalphLoops,
  mockCostData,
  mockDailyCosts,
  mockActivity,
  getAgentStats as getMockAgentStats,
} from "./mock-data";
import type { Agent, Task, RalphLoop, ActivityItem, CostSummary } from "@/types";

// Feature flag for using mock data
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true" || true;

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
  if (USE_MOCK_DATA) {
    return mockAgents;
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("name");
    
  if (error) throw error;
  return data || [];
}

/**
 * Get a single agent by ID
 */
export async function getAgent(id: string): Promise<Agent | null> {
  if (USE_MOCK_DATA) {
    return mockAgents.find((a) => a.id === id) || null;
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error) return null;
  return data;
}

/**
 * Get agent statistics
 */
export async function getAgentStats() {
  if (USE_MOCK_DATA) {
    return getMockAgentStats();
  }
  
  const agents = await getAgents();
  return {
    total: agents.length,
    online: agents.filter((a) => a.status === "online").length,
    busy: agents.filter((a) => a.status === "busy").length,
    offline: agents.filter((a) => a.status === "offline").length,
    error: agents.filter((a) => a.status === "error").length,
  };
}

/**
 * Get all tasks with optional filters
 */
export async function getTasks(options?: {
  status?: string;
  agentId?: string;
  limit?: number;
}): Promise<Task[]> {
  const supabase = await createClient();
  
  let query = supabase.from("tasks").select("*");
  
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.agentId) {
    query = query.eq("assigned_agent_id", options.agentId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Get tasks grouped by status (for Kanban view)
 */
export async function getTasksByStatus(): Promise<Record<string, Task[]>> {
  const tasks = await getTasks();
  
  return tasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

/**
 * Get active Ralph Loops
 */
export async function getRalphLoops(): Promise<RalphLoop[]> {
  if (USE_MOCK_DATA) {
    return mockRalphLoops;
  }
  
  // TODO: Read from ralph/builds/*/progress.md files
  return [];
}

/**
 * Get a specific Ralph Loop
 */
export async function getRalphLoop(buildId: string): Promise<RalphLoop | null> {
  if (USE_MOCK_DATA) {
    return mockRalphLoops.find((r) => r.buildId === buildId) || null;
  }
  
  // TODO: Read from ralph/builds/{buildId}/progress.md
  return null;
}

/**
 * Get cost data for the specified period
 */
export async function getCosts(period: "day" | "week" | "month" = "week"): Promise<CostSummary> {
  if (USE_MOCK_DATA) {
    const totalCost = mockDailyCosts.reduce((sum, d) => sum + d.totalCost, 0);
    const totalTokens = mockDailyCosts.reduce((sum, d) => sum + d.totalTokens, 0);
    
    return {
      period,
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens,
      totalRuns: mockCostData.reduce((sum, d) => sum + d.runs, 0),
      costChange: 12.5, // Mock: 12.5% increase
      tokenChange: 8.2,
      runChange: 15.3,
      byAgent: mockCostData,
      daily: mockDailyCosts,
    };
  }
  
  // TODO: Query from analytics/logs
  return {
    period,
    totalCost: 0,
    totalTokens: 0,
    totalRuns: 0,
    costChange: 0,
    tokenChange: 0,
    runChange: 0,
    byAgent: [],
    daily: [],
  };
}

/**
 * Get recent activity feed
 */
export async function getActivity(limit = 10): Promise<ActivityItem[]> {
  if (USE_MOCK_DATA) {
    return mockActivity.slice(0, limit);
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
    
  if (error || !data) return [];
  
  // Map database rows to ActivityItem type
  return data.map((row: {
    id: string;
    timestamp: string;
    agent_id: string | null;
    agent_name: string | null;
    activity_type: string;
    details: string | null;
  }) => ({
    id: row.id,
    timestamp: row.timestamp,
    agentId: row.agent_id || undefined,
    agentName: row.agent_name || undefined,
    type: (row.activity_type === "task_completed" ? "success" : "info") as "success" | "info" | "warning" | "error",
    message: row.details || row.activity_type,
    details: row.details || undefined,
  }));
}

/**
 * Format relative time (e.g., "2 min ago")
 */
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Never";
  
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return then.toLocaleDateString();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return "—";
  
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers (e.g., tokens)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
