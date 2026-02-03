/**
 * OpenClaw Task Queue Parser
 * 
 * Parses TASKS.md markdown sections (URGENT, ACTION, IN PROGRESS, COMPLETED)
 * into structured task objects compatible with Supabase schema.
 */

import type { TaskStatus, TaskPriority } from "@/lib/supabase/types";

// ============================================================================
// Types
// ============================================================================

export interface ParsedTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId: string | null;
  tags: string[];
  context: TaskContext;
  source: "TASKS.md" | "PENDING_TASKS.md";
  rawContent: string;
}

export interface TaskContext {
  deadline?: string;
  link?: string;
  source?: string;
  added?: string;
  [key: string]: string | undefined;
}

export interface TasksParseResult {
  tasks: ParsedTask[];
  agentAssignments: Map<string, string[]>; // agentId -> taskIds
  urgentCount: number;
  actionCount: number;
  inProgressCount: number;
  completedCount: number;
}

// ============================================================================
// Section Detection
// ============================================================================

const SECTION_PATTERNS = {
  urgent: /## 🔴 URGENT.*?\n([\s\S]*?)(?=## [🟡📋✅📝📊🔧]|$)/,
  action: /## 🟡 ACTION.*?\n([\s\S]*?)(?=## [🔴📋✅📝📊🔧]|$)/,
  inProgress: /## 📋 IN PROGRESS.*?\n([\s\S]*?)(?=## [🔴🟡✅📝📊🔧]|$)/,
  completed: /## ✅ COMPLETED.*?\n([\s\S]*?)(?=## [🔴🟡📋📝📊🔧]|$)/,
} as const;

type SectionType = keyof typeof SECTION_PATTERNS;

const STATUS_MAP: Record<SectionType, TaskStatus> = {
  urgent: "inbox",
  action: "assigned",
  inProgress: "in_progress",
  completed: "done",
};

const PRIORITY_MAP: Record<SectionType, TaskPriority> = {
  urgent: "urgent",
  action: "high",
  inProgress: "medium",
  completed: "medium",
};

// ============================================================================
// Task Item Parsing
// ============================================================================

/**
 * Extract task items from a section (lines starting with "- [ ]" or "- [x]")
 */
function extractTaskItems(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split("\n");
  let currentItem = "";
  let inItem = false;

  for (const line of lines) {
    // Skip HTML comments
    if (line.match(/^<!--/) || line.match(/-->$/)) {
      continue;
    }

    // New task item
    if (line.match(/^- \[[ x]\]\s*\*\*/)) {
      if (currentItem && inItem) {
        items.push(currentItem.trim());
      }
      currentItem = line;
      inItem = true;
    } 
    // Continuation line (starts with spaces or "  -")
    else if (inItem && (line.match(/^\s+-/) || line.match(/^\s+\w/) || line === "")) {
      if (line.trim()) {
        currentItem += "\n" + line;
      }
    }
    // Sub-item header (### within in-progress tasks)
    else if (line.match(/^###\s+/)) {
      if (currentItem && inItem) {
        items.push(currentItem.trim());
      }
      currentItem = line;
      inItem = true;
    }
  }

  if (currentItem && inItem) {
    items.push(currentItem.trim());
  }

  return items;
}

/**
 * Parse a single task item into ParsedTask format
 */
function parseTaskItem(rawItem: string, section: SectionType): ParsedTask | null {
  // Extract completion state
  const isCompleted = rawItem.includes("[x]");

  // Extract title - look for **bold** text
  const titleMatch = rawItem.match(/\*\*\[?([^\]]*?)\]?\*\*/);
  if (!titleMatch) {
    // Try ### header format (for in-progress tasks)
    const headerMatch = rawItem.match(/^###\s+(.+?)(?:\s*—|$)/m);
    if (!headerMatch) return null;
    return parseInProgressItem(rawItem, headerMatch[1]);
  }

  const title = titleMatch[1].trim();

  // Extract assigned agent (format: @AgentName or — @AgentName)
  const agentMatch = rawItem.match(/@(\w+)/);
  const assignedAgentId = agentMatch ? agentMatch[1].toLowerCase() : null;

  // Extract context lines
  const context: TaskContext = {};
  const contextLinePattern = /^\s+-\s+(\w+):\s*(.+)/gm;
  let contextMatch;
  while ((contextMatch = contextLinePattern.exec(rawItem)) !== null) {
    const key = contextMatch[1].toLowerCase();
    context[key] = contextMatch[2].trim();
  }

  // Generate deterministic ID
  const id = generateTaskId(title);

  // Build description from non-context lines
  const descriptionLines = rawItem
    .split("\n")
    .slice(1)
    .filter(l => l.trim() && !l.match(/^\s+-\s+\w+:/))
    .join("\n")
    .trim();

  return {
    id,
    title,
    description: descriptionLines || null,
    status: isCompleted ? "done" : STATUS_MAP[section],
    priority: PRIORITY_MAP[section],
    assignedAgentId,
    tags: extractTags(rawItem),
    context,
    source: "TASKS.md",
    rawContent: rawItem,
  };
}

/**
 * Parse in-progress task with ### header format
 */
function parseInProgressItem(rawItem: string, title: string): ParsedTask {
  // Extract status
  const statusMatch = rawItem.match(/\*\*Status:\*\*\s*(.+)/);
  const status = statusMatch ? statusMatch[1] : "";

  // Determine actual task status from status text
  let taskStatus: TaskStatus = "in_progress";
  if (status.toLowerCase().includes("complete")) taskStatus = "done";
  else if (status.toLowerCase().includes("assigned") || status.toLowerCase().includes("awaiting")) taskStatus = "assigned";

  // Extract started time
  const startedMatch = rawItem.match(/\*\*Started:\*\*\s*(.+)/);
  
  // Extract deadline
  const deadlineMatch = rawItem.match(/\*\*Deadline:\*\*\s*(.+)/);

  // Extract agent from task content
  const agentMatch = rawItem.match(/@(\w+)/);
  const assignedAgentId = agentMatch ? agentMatch[1].toLowerCase() : null;

  return {
    id: generateTaskId(title),
    title,
    description: rawItem,
    status: taskStatus,
    priority: "medium",
    assignedAgentId,
    tags: extractTags(rawItem),
    context: {
      status,
      started: startedMatch?.[1],
      deadline: deadlineMatch?.[1],
    },
    source: "TASKS.md",
    rawContent: rawItem,
  };
}

/**
 * Generate deterministic task ID from title
 */
function generateTaskId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `task-${slug}`;
}

/**
 * Extract tags from task content (words after #)
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const tagMatches = content.matchAll(/#(\w+)/g);
  for (const match of tagMatches) {
    tags.push(match[1].toLowerCase());
  }
  return [...new Set(tags)];
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse full TASKS.md content into structured result
 */
export function parseTasksMd(content: string): TasksParseResult {
  const tasks: ParsedTask[] = [];
  const agentAssignments = new Map<string, string[]>();

  let urgentCount = 0;
  let actionCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;

  // Parse each section
  for (const [sectionKey, pattern] of Object.entries(SECTION_PATTERNS)) {
    const section = sectionKey as SectionType;
    const match = content.match(pattern);
    
    if (!match) continue;

    const sectionContent = match[1];
    const items = extractTaskItems(sectionContent);

    for (const item of items) {
      const task = parseTaskItem(item, section);
      if (!task) continue;

      tasks.push(task);

      // Track agent assignments
      if (task.assignedAgentId) {
        const existing = agentAssignments.get(task.assignedAgentId) || [];
        existing.push(task.id);
        agentAssignments.set(task.assignedAgentId, existing);
      }

      // Update counts
      switch (section) {
        case "urgent": urgentCount++; break;
        case "action": actionCount++; break;
        case "inProgress": inProgressCount++; break;
        case "completed": completedCount++; break;
      }
    }
  }

  return {
    tasks,
    agentAssignments,
    urgentCount,
    actionCount,
    inProgressCount,
    completedCount,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get tasks by status
 */
export function filterByStatus(tasks: ParsedTask[], status: TaskStatus): ParsedTask[] {
  return tasks.filter(t => t.status === status);
}

/**
 * Get tasks by agent
 */
export function filterByAgent(tasks: ParsedTask[], agentId: string): ParsedTask[] {
  return tasks.filter(t => t.assignedAgentId === agentId);
}

/**
 * Get tasks by priority
 */
export function filterByPriority(tasks: ParsedTask[], priority: TaskPriority): ParsedTask[] {
  return tasks.filter(t => t.priority === priority);
}

/**
 * Sort tasks by priority (urgent first)
 */
export function sortByPriority(tasks: ParsedTask[]): ParsedTask[] {
  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get current task for an agent (highest priority in-progress task)
 */
export function getCurrentTask(tasks: ParsedTask[], agentId: string): ParsedTask | null {
  const agentTasks = filterByAgent(tasks, agentId);
  const inProgress = filterByStatus(agentTasks, "in_progress");
  const sorted = sortByPriority(inProgress);
  return sorted[0] || null;
}
