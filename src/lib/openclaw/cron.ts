/**
 * OpenClaw Sync Cron Job
 * 
 * This script is designed to run via OpenClaw's cron scheduler every 5 minutes.
 * It reads workspace files (TASKS.md, PENDING_TASKS.md, agent statuses) and
 * POSTs the parsed data to the Mission Control sync API.
 * 
 * To set up:
 * 1. Configure OpenClaw cron with schedule: every 5 minutes
 * 2. Set MISSION_CONTROL_API_URL environment variable
 * 3. Optionally set MISSION_CONTROL_API_KEY for authentication
 * 
 * @module openclaw/cron
 */

import * as fs from "fs/promises";
import * as path from "path";

// ============================================================================
// Types (duplicated from sync.ts to keep cron self-contained)
// ============================================================================

type AgentStatus = "online" | "busy" | "offline" | "error";
type TaskStatus = "inbox" | "assigned" | "in_progress" | "done" | "blocked";
type TaskPriority = "urgent" | "high" | "medium" | "low";
type ActivityType = "agent_status_change" | "task_created" | "task_updated" | "system_event";

interface OpenClawAgent {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  domain: string;
  description: string;
  soulPath: string;
  status: AgentStatus;
  lastHeartbeat: string | null;
  heartbeatSchedule: string | null;
  currentTask: string | null;
}

interface OpenClawTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  context: Record<string, unknown>;
}

interface OpenClawActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  agentId: string | null;
  taskId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface SyncData {
  agents: OpenClawAgent[];
  tasks: OpenClawTask[];
  activities: OpenClawActivity[];
  syncedAt: string;
}

interface SyncResult {
  success: boolean;
  synced_at: string;
  counts: {
    agents_upserted: number;
    tasks_upserted: number;
    activities_inserted: number;
  };
  errors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the sync cron job
 */
export interface CronConfig {
  /** Base URL for the Mission Control API */
  apiUrl: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Path to OpenClaw workspace root */
  workspacePath: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Whether to log verbose output */
  verbose: boolean;
}

/**
 * Get default configuration from environment
 */
export function getDefaultConfig(): CronConfig {
  return {
    apiUrl: process.env.MISSION_CONTROL_API_URL ?? "https://agent-mission-control.vercel.app",
    apiKey: process.env.MISSION_CONTROL_API_KEY,
    workspacePath: process.env.OPENCLAW_WORKSPACE ?? process.cwd(),
    timeoutMs: 30000,
    verbose: process.env.SYNC_VERBOSE === "true",
  };
}

// ============================================================================
// Known Agents (must match agents/ directory structure)
// ============================================================================

interface AgentDefinition {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  domain: string;
}

const KNOWN_AGENTS: AgentDefinition[] = [
  { id: "klaus", name: "klaus", displayName: "Klaus", emoji: "🎯", domain: "Squad Lead" },
  { id: "iris", name: "iris", displayName: "Iris", emoji: "📧", domain: "Email & Comms" },
  { id: "atlas", name: "atlas", displayName: "Atlas", emoji: "📅", domain: "Calendar & Meetings" },
  { id: "oracle", name: "oracle", displayName: "Oracle", emoji: "🔮", domain: "Intelligence & Research" },
  { id: "sentinel", name: "sentinel", displayName: "Sentinel", emoji: "📊", domain: "Metrics & Alerts" },
  { id: "herald", name: "herald", displayName: "Herald", emoji: "📢", domain: "Content & Brand" },
  { id: "forge", name: "forge", displayName: "Forge", emoji: "🔨", domain: "Code & PRs" },
  { id: "aegis", name: "aegis", displayName: "Aegis", emoji: "🛡️", domain: "Testing & QA" },
  { id: "codex", name: "codex", displayName: "Codex", emoji: "📚", domain: "Docs & Knowledge" },
  { id: "pixel", name: "pixel", displayName: "Pixel", emoji: "🎨", domain: "UX & Design" },
  { id: "pathfinder", name: "pathfinder", displayName: "Pathfinder", emoji: "🧭", domain: "Travel & Logistics" },
  { id: "curator", name: "curator", displayName: "Curator", emoji: "🎁", domain: "Gifts & Occasions" },
  { id: "steward", name: "steward", displayName: "Steward", emoji: "🏠", domain: "Personal Admin" },
];

// ============================================================================
// File Reading
// ============================================================================

/**
 * Read a file from the workspace, returning empty string if not found
 */
async function readWorkspaceFile(workspacePath: string, relativePath: string): Promise<string> {
  const fullPath = path.join(workspacePath, relativePath);
  try {
    return await fs.readFile(fullPath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

// ============================================================================
// TASKS.md Parser
// ============================================================================

interface TasksSection {
  urgent: string[];
  action: string[];
  inProgress: string[];
  completed: string[];
}

function parseTasksMd(content: string): TasksSection {
  const sections: TasksSection = {
    urgent: [],
    action: [],
    inProgress: [],
    completed: [],
  };

  const urgentMatch = content.match(/## 🔴 URGENT.*?\n([\s\S]*?)(?=## |$)/);
  const actionMatch = content.match(/## 🟡 ACTION.*?\n([\s\S]*?)(?=## |$)/);
  const progressMatch = content.match(/## 📋 IN PROGRESS.*?\n([\s\S]*?)(?=## |$)/);
  const completedMatch = content.match(/## ✅ COMPLETED.*?\n([\s\S]*?)(?=## |$)/);

  if (urgentMatch) sections.urgent = extractTaskItems(urgentMatch[1]);
  if (actionMatch) sections.action = extractTaskItems(actionMatch[1]);
  if (progressMatch) sections.inProgress = extractTaskItems(progressMatch[1]);
  if (completedMatch) sections.completed = extractTaskItems(completedMatch[1]);

  return sections;
}

function extractTaskItems(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split("\n");
  let currentItem = "";

  for (const line of lines) {
    if (line.match(/^- \[[ x]\]/)) {
      if (currentItem) items.push(currentItem.trim());
      currentItem = line;
    } else if (line.startsWith("  ") && currentItem) {
      currentItem += "\n" + line;
    } else if (line.match(/^<!--/) || line.match(/^\*[^*]/)) {
      continue;
    }
  }

  if (currentItem) items.push(currentItem.trim());
  return items;
}

function parseTaskItem(
  item: string,
  section: "urgent" | "action" | "inProgress" | "completed"
): OpenClawTask | null {
  const isCompleted = item.includes("- [x]");
  
  const titleMatch = item.match(/\*\*([^*]+)\*\*/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  const agentMatch = item.match(/@(\w+)/);
  const assignedAgentId = agentMatch ? agentMatch[1].toLowerCase() : null;

  const contextLines = item.split("\n").slice(1);
  const context: Record<string, string> = {};
  for (const line of contextLines) {
    const ctxMatch = line.match(/^\s*- (\w+):\s*(.+)/);
    if (ctxMatch) {
      context[ctxMatch[1].toLowerCase()] = ctxMatch[2];
    }
  }

  const statusMap: Record<string, TaskStatus> = {
    urgent: "inbox",
    action: "assigned",
    inProgress: "in_progress",
    completed: "done",
  };

  const priorityMap: Record<string, TaskPriority> = {
    urgent: "urgent",
    action: "high",
    inProgress: "medium",
    completed: "medium",
  };

  const id = `task-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`;

  return {
    id,
    title,
    description: contextLines.join("\n").trim() || "",
    status: isCompleted ? "done" : statusMap[section],
    priority: priorityMap[section],
    assignedAgentId,
    createdAt: context.added || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    context,
  };
}

// ============================================================================
// PENDING_TASKS.md Parser
// ============================================================================

function parsePendingTasksMd(content: string): OpenClawTask[] {
  const tasks: OpenClawTask[] = [];

  const inProgressMatch = content.match(/## 🔄 In Progress\n([\s\S]*?)(?=\n## [^#]|$)/);
  if (inProgressMatch) {
    const items = extractPendingItems(inProgressMatch[1]);
    for (const item of items) {
      const task = parsePendingItem(item, "in_progress");
      if (task) tasks.push(task);
    }
  }

  const completedMatch = content.match(/## ✅ Completed Today\n([\s\S]*?)(?=\n## [^#]|$)/);
  if (completedMatch) {
    const items = extractPendingItems(completedMatch[1]);
    for (const item of items) {
      const task = parsePendingItem(item, "done");
      if (task) tasks.push(task);
    }
  }

  return tasks;
}

function extractPendingItems(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split("\n");
  let currentItem = "";

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (currentItem) items.push(currentItem.trim());
      currentItem = line;
    } else if (currentItem && line.trim()) {
      currentItem += "\n" + line;
    }
  }

  if (currentItem) items.push(currentItem.trim());
  return items;
}

function parsePendingItem(item: string, status: TaskStatus): OpenClawTask | null {
  const titleMatch = item.match(/^### (.+?)(?:\s*—|$)/m);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim();

  const ownerMatch = item.match(/\*\*Owner:\*\*\s*(\w+)/);
  const assignedAgentId = ownerMatch ? ownerMatch[1].toLowerCase() : null;

  const completedMatch = item.match(/\*\*Completed:\*\*\s*(.+)/);
  const completedAt = completedMatch ? completedMatch[1] : null;

  const id = `pending-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`;

  return {
    id,
    title,
    description: item,
    status,
    priority: "medium",
    assignedAgentId,
    createdAt: new Date().toISOString(),
    updatedAt: completedAt || new Date().toISOString(),
    tags: ["async-task"],
    context: { source: "PENDING_TASKS.md" },
  };
}

// ============================================================================
// Agent Status Parser
// ============================================================================

function parseAgentStatusTable(content: string): Map<string, { lastHeartbeat: string; status: AgentStatus }> {
  const statusMap = new Map<string, { lastHeartbeat: string; status: AgentStatus }>();

  const tableMatch = content.match(/## 📊 SQUAD STATUS\n\n[\s\S]*?\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (!tableMatch) return statusMap;

  const lines = tableMatch[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  
  for (const line of lines) {
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    const agentName = cells[0].toLowerCase();
    const lastHeartbeat = cells[2];
    const statusEmoji = cells[3];

    let status: AgentStatus = "offline";
    if (statusEmoji.includes("🟢")) status = "online";
    else if (statusEmoji.includes("🟡")) status = "busy";
    else if (statusEmoji.includes("🔴")) status = "error";

    statusMap.set(agentName, { lastHeartbeat, status });
  }

  return statusMap;
}

// ============================================================================
// Activity Parser
// ============================================================================

function parseAgentReports(content: string): OpenClawActivity[] {
  const activities: OpenClawActivity[] = [];

  const reportsMatch = content.match(/## 📝 AGENT REPORTS\n([\s\S]*?)(?=\n---\n|$)/);
  if (!reportsMatch) return activities;

  const reportMatches = reportsMatch[1].matchAll(/#### (\w+).*?\n\*Last check: ([^*]+)\*\n([\s\S]*?)(?=####|$)/g);

  for (const match of reportMatches) {
    const agentName = match[1].toLowerCase();
    const timestamp = match[2].trim();
    const reportContent = match[3].trim();

    const id = `report-${agentName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activities.push({
      id,
      type: "agent_status_change",
      title: `${match[1]} heartbeat report`,
      description: reportContent.slice(0, 500),
      agentId: agentName,
      taskId: null,
      createdAt: timestamp,
      metadata: { source: "TASKS.md", fullReport: reportContent },
    });
  }

  return activities;
}

// ============================================================================
// Sync Data Creation
// ============================================================================

function createSyncData(
  tasksMdContent: string,
  pendingTasksContent: string,
  agentStatuses: Map<string, { lastHeartbeat: string; status: AgentStatus }>
): SyncData {
  const tasksSections = parseTasksMd(tasksMdContent);
  const tasks: OpenClawTask[] = [];

  for (const item of tasksSections.urgent) {
    const task = parseTaskItem(item, "urgent");
    if (task) tasks.push(task);
  }
  for (const item of tasksSections.action) {
    const task = parseTaskItem(item, "action");
    if (task) tasks.push(task);
  }
  for (const item of tasksSections.inProgress) {
    const task = parseTaskItem(item, "inProgress");
    if (task) tasks.push(task);
  }
  for (const item of tasksSections.completed) {
    const task = parseTaskItem(item, "completed");
    if (task) tasks.push(task);
  }

  const pendingTasks = parsePendingTasksMd(pendingTasksContent);
  tasks.push(...pendingTasks);

  const agents: OpenClawAgent[] = KNOWN_AGENTS.map(def => {
    const statusInfo = agentStatuses.get(def.id);
    return {
      id: def.id,
      name: def.name,
      displayName: def.displayName,
      emoji: def.emoji,
      domain: def.domain,
      description: `${def.displayName} — ${def.domain}`,
      soulPath: `agents/${def.id}/SOUL.md`,
      status: statusInfo?.status || "offline",
      lastHeartbeat: statusInfo?.lastHeartbeat || null,
      heartbeatSchedule: null,
      currentTask: null,
    };
  });

  const activities = parseAgentReports(tasksMdContent);

  return {
    agents,
    tasks,
    activities,
    syncedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Format for Supabase API
// ============================================================================

function formatForSupabase(data: SyncData) {
  return {
    agents: data.agents.map(a => ({
      id: a.id,
      name: a.name,
      display_name: a.displayName,
      emoji: a.emoji,
      domain: a.domain,
      description: a.description,
      soul_path: a.soulPath,
      skills: [],
      tools: [],
      status: a.status,
      session_key: `agent:${a.id}:main`,
      last_heartbeat: a.lastHeartbeat,
      current_task_id: a.currentTask,
      heartbeat_schedule: a.heartbeatSchedule,
      heartbeat_interval_minutes: null,
      updated_at: new Date().toISOString(),
    })),
    tasks: data.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assigned_agent_id: t.assignedAgentId,
      created_by: null,
      parent_task_id: null,
      context: t.context,
      tags: t.tags,
      due_date: null,
      started_at: null,
      completed_at: t.status === "done" ? t.updatedAt : null,
      updated_at: t.updatedAt,
    })),
    activities: data.activities.map(a => ({
      id: a.id,
      activity_type: a.type,
      title: a.title,
      description: a.description,
      agent_id: a.agentId,
      task_id: a.taskId,
      message_id: null,
      metadata: a.metadata,
      created_at: a.createdAt,
    })),
    synced_at: data.syncedAt,
  };
}

// ============================================================================
// Main Sync Function
// ============================================================================

/**
 * Execute the sync cron job
 * 
 * @param config - Optional configuration override
 * @returns Sync result with success status and counts
 */
export async function runSync(config?: Partial<CronConfig>): Promise<SyncResult> {
  const cfg = { ...getDefaultConfig(), ...config };
  const log = cfg.verbose ? console.log : () => {};

  log(`[Sync] Starting sync at ${new Date().toISOString()}`);
  log(`[Sync] Workspace: ${cfg.workspacePath}`);
  log(`[Sync] API URL: ${cfg.apiUrl}`);

  try {
    // Read workspace files
    log("[Sync] Reading workspace files...");
    const tasksMd = await readWorkspaceFile(cfg.workspacePath, "TASKS.md");
    const pendingTasksMd = await readWorkspaceFile(cfg.workspacePath, "PENDING_TASKS.md");

    // Parse agent statuses from TASKS.md
    const agentStatuses = parseAgentStatusTable(tasksMd);
    log(`[Sync] Found ${agentStatuses.size} agent statuses`);

    // Create sync data
    const syncData = createSyncData(tasksMd, pendingTasksMd, agentStatuses);
    log(`[Sync] Parsed ${syncData.agents.length} agents, ${syncData.tasks.length} tasks, ${syncData.activities.length} activities`);

    // Format for API
    const payload = formatForSupabase(syncData);

    // Send to sync API
    log("[Sync] Posting to sync API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cfg.apiKey) {
      headers["Authorization"] = `Bearer ${cfg.apiKey}`;
    }

    const response = await fetch(`${cfg.apiUrl}/api/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result: SyncResult = await response.json();
    log(`[Sync] Result: ${JSON.stringify(result)}`);

    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Sync] Error: ${message}`);
    
    return {
      success: false,
      synced_at: new Date().toISOString(),
      counts: {
        agents_upserted: 0,
        tasks_upserted: 0,
        activities_inserted: 0,
      },
      errors: [message],
    };
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Run sync when executed directly
 */
async function main() {
  const result = await runSync({ verbose: true });
  
  if (result.success) {
    console.log(`✅ Sync completed successfully`);
    console.log(`   Agents: ${result.counts.agents_upserted}`);
    console.log(`   Tasks: ${result.counts.tasks_upserted}`);
    console.log(`   Activities: ${result.counts.activities_inserted}`);
    process.exit(0);
  } else {
    console.error(`❌ Sync failed`);
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  main();
}

// ============================================================================
// Exports for Testing
// ============================================================================

export {
  parseTasksMd,
  parsePendingTasksMd,
  parseAgentStatusTable,
  parseAgentReports,
  createSyncData,
  formatForSupabase,
  readWorkspaceFile,
  KNOWN_AGENTS,
};
