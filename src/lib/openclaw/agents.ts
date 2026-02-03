/**
 * OpenClaw Agent Status Module
 * 
 * Parses agent heartbeat schedules from OpenClaw cron data
 * and maps session states to agent statuses.
 */

import type { AgentStatus } from "@/lib/supabase/types";

// ============================================================================
// Types
// ============================================================================

export interface CronJob {
  id: string;
  name: string;
  schedule: {
    kind: "at" | "every" | "cron";
    expr?: string;
    everyMs?: number;
    atMs?: number;
    tz?: string;
  };
  payload: {
    kind: "systemEvent" | "agentTurn";
    text?: string;
    message?: string;
    model?: string;
  };
  sessionTarget: "main" | "isolated";
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface SessionInfo {
  key: string;
  kind: string;
  lastActivity?: string;
  messageCount?: number;
}

export interface AgentStatusInfo {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: string | null;
  heartbeatSchedule: string | null;
  currentTask: string | null;
  sessionKey: string | null;
}

// ============================================================================
// Cron Schedule Parsing
// ============================================================================

/**
 * Parse cron jobs list and extract agent heartbeat schedules
 */
export function parseAgentCronJobs(cronJobs: CronJob[]): Map<string, { schedule: string; lastRun: string | null }> {
  const agentSchedules = new Map<string, { schedule: string; lastRun: string | null }>();

  for (const job of cronJobs) {
    // Check if this is an agent heartbeat cron
    // Convention: job names like "Forge Heartbeat", "Iris Heartbeat"
    const nameMatch = job.name?.match(/^(\w+)\s+Heartbeat$/i);
    if (!nameMatch) continue;

    const agentId = nameMatch[1].toLowerCase();
    
    // Extract schedule string
    let scheduleStr = "";
    if (job.schedule.kind === "cron" && job.schedule.expr) {
      scheduleStr = job.schedule.expr;
    } else if (job.schedule.kind === "every" && job.schedule.everyMs) {
      const minutes = Math.round(job.schedule.everyMs / 60000);
      scheduleStr = `every ${minutes}m`;
    } else if (job.schedule.kind === "at" && job.schedule.atMs) {
      scheduleStr = `at ${new Date(job.schedule.atMs).toISOString()}`;
    }

    agentSchedules.set(agentId, {
      schedule: scheduleStr,
      lastRun: job.lastRun || null,
    });
  }

  return agentSchedules;
}

/**
 * Parse cron expression to human-readable interval
 */
export function cronToInterval(expr: string): number | null {
  // Parse common patterns like "*/30 * * * *" (every 30 minutes)
  const everyMinMatch = expr.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (everyMinMatch) {
    return parseInt(everyMinMatch[1], 10);
  }

  // Parse patterns like "0 */2 * * *" (every 2 hours)
  const everyHourMatch = expr.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (everyHourMatch) {
    return parseInt(everyHourMatch[1], 10) * 60;
  }

  // Parse patterns like "15 * * * *" (at minute 15 every hour)
  const hourlyMatch = expr.match(/^(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (hourlyMatch) {
    return 60;
  }

  return null;
}

// ============================================================================
// Session State Mapping
// ============================================================================

/**
 * Determine agent status from session activity
 */
export function determineAgentStatus(
  lastHeartbeat: string | null,
  heartbeatIntervalMinutes: number | null,
  currentTask: string | null
): AgentStatus {
  // If has current task, agent is busy
  if (currentTask) {
    return "busy";
  }

  // If no heartbeat info, assume offline
  if (!lastHeartbeat) {
    return "offline";
  }

  // Check if heartbeat is recent
  const heartbeatTime = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  const elapsedMs = now - heartbeatTime;

  // Default interval: 30 minutes
  const intervalMs = (heartbeatIntervalMinutes || 30) * 60 * 1000;
  
  // Allow 2x interval before marking as offline
  const threshold = intervalMs * 2;

  if (elapsedMs > threshold) {
    return "offline";
  }

  // Within threshold and no current task = online
  return "online";
}

/**
 * Map session kind to agent ID if applicable
 */
export function sessionKeyToAgentId(sessionKey: string): string | null {
  // Convention: "agent:name:main" or "agent:name:isolated:xxx"
  const match = sessionKey.match(/^agent:(\w+):/);
  return match ? match[1].toLowerCase() : null;
}

// ============================================================================
// Combined Agent Status
// ============================================================================

/**
 * Build complete agent status info from cron jobs and sessions
 */
export function buildAgentStatuses(
  cronJobs: CronJob[],
  sessions: SessionInfo[],
  taskAssignments: Map<string, string> // agentId -> taskTitle
): AgentStatusInfo[] {
  const cronSchedules = parseAgentCronJobs(cronJobs);
  
  // Map sessions by agent ID
  const sessionsByAgent = new Map<string, SessionInfo>();
  for (const session of sessions) {
    const agentId = sessionKeyToAgentId(session.key);
    if (agentId) {
      sessionsByAgent.set(agentId, session);
    }
  }

  // Known agents
  const agentIds = [
    "klaus", "iris", "atlas", "oracle", "sentinel", 
    "herald", "forge", "aegis", "codex", "pixel",
    "pathfinder", "curator", "steward"
  ];

  return agentIds.map(agentId => {
    const cronInfo = cronSchedules.get(agentId);
    const session = sessionsByAgent.get(agentId);
    const currentTask = taskAssignments.get(agentId) || null;

    // Parse heartbeat interval from cron expression
    let heartbeatIntervalMinutes: number | null = null;
    if (cronInfo?.schedule) {
      if (cronInfo.schedule.startsWith("every ")) {
        const mins = parseInt(cronInfo.schedule.replace("every ", "").replace("m", ""), 10);
        if (!isNaN(mins)) heartbeatIntervalMinutes = mins;
      } else {
        heartbeatIntervalMinutes = cronToInterval(cronInfo.schedule);
      }
    }

    const status = determineAgentStatus(
      cronInfo?.lastRun || session?.lastActivity || null,
      heartbeatIntervalMinutes,
      currentTask
    );

    return {
      agentId,
      status,
      lastHeartbeat: cronInfo?.lastRun || session?.lastActivity || null,
      heartbeatSchedule: cronInfo?.schedule || null,
      currentTask,
      sessionKey: session?.key || `agent:${agentId}:main`,
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration since last heartbeat
 */
export function formatTimeSinceHeartbeat(lastHeartbeat: string | null): string {
  if (!lastHeartbeat) return "Never";

  const ms = Date.now() - new Date(lastHeartbeat).getTime();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Check if agent is overdue for heartbeat
 */
export function isHeartbeatOverdue(
  lastHeartbeat: string | null,
  intervalMinutes: number
): boolean {
  if (!lastHeartbeat) return true;

  const ms = Date.now() - new Date(lastHeartbeat).getTime();
  const overdueThreshold = intervalMinutes * 60 * 1000 * 1.5; // 1.5x interval

  return ms > overdueThreshold;
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case "online": return "text-green-400";
    case "busy": return "text-amber-400";
    case "error": return "text-red-400";
    case "offline": 
    default: return "text-gray-400";
  }
}
