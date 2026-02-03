/**
 * Mission Control Dashboard — Type Definitions
 * 
 * Re-exports Supabase types and adds UI-specific types
 */

// Re-export database types
export type {
  Database,
  Json,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  ActivityType,
  NotificationPriority,
} from "@/lib/supabase/types";

import type { Database } from "@/lib/supabase/types";

// Convenience type aliases for database rows
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// UI-specific status types (maps to visual states)
export type UIAgentStatus = "active" | "idle" | "working" | "error" | "offline";

// Map database status to UI status
export function mapAgentStatusToUI(status: string): UIAgentStatus {
  switch (status) {
    case "online":
      return "active";
    case "busy":
      return "working";
    case "error":
      return "error";
    case "offline":
    default:
      return "offline";
  }
}

// Ralph Loop types (for monitoring autonomous builds)
export interface RalphLoop {
  id: string;
  buildId: string;
  name: string;
  agent: string;
  phase: "interview" | "plan" | "build" | "done" | "blocked";
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  lastUpdate: string;
  estimatedCompletion?: string;
  tokensUsed: number;
  cost: number;
  output: RalphOutput[];
}

export interface RalphOutput {
  timestamp: string;
  type: "success" | "info" | "error";
  message: string;
}

// Cost tracking types
export interface CostData {
  agentId: string;
  agentName: string;
  date: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface DailyCost {
  date: string;
  totalCost: number;
  totalTokens: number;
  byAgent: Record<string, number>;
}

export interface CostSummary {
  period: "day" | "week" | "month";
  totalCost: number;
  totalTokens: number;
  totalRuns: number;
  costChange: number; // percentage vs previous period
  tokenChange: number;
  runChange: number;
  byAgent: CostData[];
  daily: DailyCost[];
}

// Dashboard metric types
export interface MetricData {
  value: number | string;
  label: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number;
    label: string;
  };
}

// Activity feed types
export interface ActivityItem {
  id: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  type: "success" | "info" | "warning" | "error";
  message: string;
  details?: string;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}
