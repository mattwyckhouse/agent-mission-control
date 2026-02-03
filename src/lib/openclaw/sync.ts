/**
 * OpenClaw Data Sync Service
 * 
 * Reads data from OpenClaw workspace files (TASKS.md, PENDING_TASKS.md, agent SOULs)
 * and transforms it into Supabase-compatible format.
 */

import type { 
  AgentStatus, 
  TaskStatus, 
  TaskPriority, 
  ActivityType 
} from "@/lib/supabase/types";

// ============================================================================
// Types
// ============================================================================

export interface OpenClawAgent {
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

export interface OpenClawTask {
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

export interface OpenClawActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  agentId: string | null;
  taskId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface SyncData {
  agents: OpenClawAgent[];
  tasks: OpenClawTask[];
  activities: OpenClawActivity[];
  syncedAt: string;
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

/**
 * Parse TASKS.md markdown content into structured sections
 */
export function parseTasksMd(content: string): TasksSection {
  const sections: TasksSection = {
    urgent: [],
    action: [],
    inProgress: [],
    completed: [],
  };

  // Split by section headers
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

/**
 * Extract individual task items from a section
 */
function extractTaskItems(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split("\n");
  let currentItem = "";

  for (const line of lines) {
    // Task item starts with "- [ ]" or "- [x]"
    if (line.match(/^- \[[ x]\]/)) {
      if (currentItem) items.push(currentItem.trim());
      currentItem = line;
    } else if (line.startsWith("  ") && currentItem) {
      // Continuation of current item (indented)
      currentItem += "\n" + line;
    } else if (line.match(/^<!--/) || line.match(/^\*[^*]/)) {
      // Skip comments and italics (format hints)
      continue;
    }
  }

  if (currentItem) items.push(currentItem.trim());
  return items;
}

/**
 * Parse a single task item into OpenClawTask format
 */
export function parseTaskItem(
  item: string,
  section: "urgent" | "action" | "inProgress" | "completed"
): OpenClawTask | null {
  // Extract checkbox state
  const isCompleted = item.includes("- [x]");
  
  // Extract title (bold text after checkbox)
  const titleMatch = item.match(/\*\*([^*]+)\*\*/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  // Extract assigned agent (format: @AgentName or — @AgentName)
  const agentMatch = item.match(/@(\w+)/);
  const assignedAgentId = agentMatch ? agentMatch[1].toLowerCase() : null;

  // Extract context lines
  const contextLines = item.split("\n").slice(1);
  const context: Record<string, string> = {};
  for (const line of contextLines) {
    const ctxMatch = line.match(/^\s*- (\w+):\s*(.+)/);
    if (ctxMatch) {
      context[ctxMatch[1].toLowerCase()] = ctxMatch[2];
    }
  }

  // Map section to status
  const statusMap: Record<string, TaskStatus> = {
    urgent: "inbox",
    action: "assigned",
    inProgress: "in_progress",
    completed: "done",
  };

  // Map section to priority
  const priorityMap: Record<string, TaskPriority> = {
    urgent: "urgent",
    action: "high",
    inProgress: "medium",
    completed: "medium",
  };

  // Generate deterministic ID from title
  const id = `task-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`;

  return {
    id,
    title,
    description: contextLines.join("\n").trim() || null as unknown as string,
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

export function parsePendingTasksMd(content: string): OpenClawTask[] {
  const tasks: OpenClawTask[] = [];

  // Extract "In Progress" section
  const inProgressMatch = content.match(/## 🔄 In Progress\n([\s\S]*?)(?=## |$)/);
  if (inProgressMatch) {
    const items = extractPendingItems(inProgressMatch[1]);
    for (const item of items) {
      const task = parsePendingItem(item, "in_progress");
      if (task) tasks.push(task);
    }
  }

  // Extract "Completed Today" section
  const completedMatch = content.match(/## ✅ Completed Today\n([\s\S]*?)(?=## |$)/);
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
    // New item starts with "###" 
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
  // Extract title from ### header
  const titleMatch = item.match(/^### (.+?)(?:\s*—|$)/m);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim();

  // Extract owner
  const ownerMatch = item.match(/\*\*Owner:\*\*\s*(\w+)/);
  const assignedAgentId = ownerMatch ? ownerMatch[1].toLowerCase() : null;

  // Extract completed time
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
// Agent Parser
// ============================================================================

interface AgentDefinition {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  domain: string;
}

/**
 * Known agents in the Mission Control squad
 */
export const KNOWN_AGENTS: AgentDefinition[] = [
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

/**
 * Parse agent status from TASKS.md squad status table
 */
export function parseAgentStatusTable(content: string): Map<string, { lastHeartbeat: string; status: AgentStatus }> {
  const statusMap = new Map<string, { lastHeartbeat: string; status: AgentStatus }>();

  // Find the squad status table
  const tableMatch = content.match(/## 📊 SQUAD STATUS\n\n[\s\S]*?\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (!tableMatch) return statusMap;

  const lines = tableMatch[1].split("\n").filter(l => l.startsWith("|") && !l.includes("---"));
  
  for (const line of lines) {
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    const agentName = cells[0].toLowerCase();
    const lastHeartbeat = cells[2];
    const statusEmoji = cells[3];

    // Map emoji to status
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

/**
 * Parse agent reports section into activities
 */
export function parseAgentReports(content: string): OpenClawActivity[] {
  const activities: OpenClawActivity[] = [];

  // Find the agent reports section
  const reportsMatch = content.match(/## 📝 AGENT REPORTS\n([\s\S]*?)(?=\n---\n|$)/);
  if (!reportsMatch) return activities;

  // Extract individual reports (#### headers)
  const reportMatches = reportsMatch[1].matchAll(/#### (\w+).*?\n\*Last check: ([^*]+)\*\n([\s\S]*?)(?=####|$)/g);

  for (const match of reportMatches) {
    const agentName = match[1].toLowerCase();
    const timestamp = match[2].trim();
    const reportContent = match[3].trim();

    // Create activity for this report
    const id = `report-${agentName}-${new Date().getTime()}`;
    activities.push({
      id,
      type: "agent_status_change",
      title: `${match[1]} heartbeat report`,
      description: reportContent.slice(0, 500), // Truncate long reports
      agentId: agentName,
      taskId: null,
      createdAt: timestamp,
      metadata: { source: "TASKS.md", fullReport: reportContent },
    });
  }

  return activities;
}

// ============================================================================
// Main Sync Functions
// ============================================================================

/**
 * Create SyncData from parsed content
 */
export function createSyncData(
  tasksMdContent: string,
  pendingTasksContent: string,
  agentStatuses: Map<string, { lastHeartbeat: string; status: AgentStatus }>
): SyncData {
  // Parse tasks
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

  // Add pending tasks
  const pendingTasks = parsePendingTasksMd(pendingTasksContent);
  tasks.push(...pendingTasks);

  // Build agents list
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

  // Parse activities from agent reports
  const activities = parseAgentReports(tasksMdContent);

  return {
    agents,
    tasks,
    activities,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Format SyncData for Supabase upsert
 */
export function formatForSupabase(data: SyncData) {
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
