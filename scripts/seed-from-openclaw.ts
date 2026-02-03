#!/usr/bin/env npx tsx
/**
 * Initial Data Seeding Script
 * 
 * One-time script to populate Supabase from current OpenClaw workspace state.
 * Reads agent definitions, TASKS.md, PENDING_TASKS.md and seeds the database.
 * 
 * Usage:
 *   npx tsx scripts/seed-from-openclaw.ts [options]
 * 
 * Options:
 *   --workspace <path>  Path to OpenClaw workspace (default: ~/.openclaw/workspace)
 *   --dry-run           Print what would be seeded without writing
 *   --verbose           Show detailed output
 *   --clear             Clear existing data before seeding (CAUTION!)
 * 
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL      Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anon key
 *   SUPABASE_SERVICE_ROLE_KEY     Service role key (for admin operations)
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

type AgentStatus = "online" | "busy" | "offline" | "error";
type TaskStatus = "inbox" | "assigned" | "in_progress" | "done" | "blocked";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface AgentRecord {
  id: string;
  name: string;
  display_name: string;
  emoji: string | null;
  domain: string;
  description: string | null;
  soul_path: string | null;
  skills: string[];
  tools: string[];
  status: AgentStatus;
  session_key: string | null;
  last_heartbeat: string | null;
  current_task_id: string | null;
  heartbeat_schedule: string | null;
  heartbeat_interval_minutes: number | null;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent_id: string | null;
  created_by: string | null;
  parent_task_id: string | null;
  context: Record<string, unknown>;
  tags: string[];
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface ActivityRecord {
  activity_type: string;
  title: string;
  description: string | null;
  agent_id: string | null;
  task_id: string | null;
  message_id: string | null;
  metadata: Record<string, unknown>;
}

interface SeedOptions {
  workspacePath: string;
  dryRun: boolean;
  verbose: boolean;
  clear: boolean;
}

// ============================================================================
// Agent Definitions (from AGENTS.md)
// ============================================================================

const KNOWN_AGENTS = [
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
// File Utilities
// ============================================================================

async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Parsers (simplified versions from cron.ts)
// ============================================================================

function parseTasksMd(content: string): TaskRecord[] {
  const tasks: TaskRecord[] = [];
  
  // Parse URGENT section
  const urgentMatch = content.match(/## 🔴 URGENT.*?\n([\s\S]*?)(?=## |$)/);
  if (urgentMatch) {
    const items = extractTaskItems(urgentMatch[1]);
    for (const item of items) {
      const task = parseTaskItem(item, "inbox", "urgent");
      if (task) tasks.push(task);
    }
  }

  // Parse ACTION section
  const actionMatch = content.match(/## 🟡 ACTION.*?\n([\s\S]*?)(?=## |$)/);
  if (actionMatch) {
    const items = extractTaskItems(actionMatch[1]);
    for (const item of items) {
      const task = parseTaskItem(item, "assigned", "high");
      if (task) tasks.push(task);
    }
  }

  // Parse IN PROGRESS section
  const progressMatch = content.match(/## 📋 IN PROGRESS.*?\n([\s\S]*?)(?=## |$)/);
  if (progressMatch) {
    const items = extractTaskItems(progressMatch[1]);
    for (const item of items) {
      const task = parseTaskItem(item, "in_progress", "medium");
      if (task) tasks.push(task);
    }
  }

  // Parse COMPLETED section
  const completedMatch = content.match(/## ✅ COMPLETED.*?\n([\s\S]*?)(?=## |$)/);
  if (completedMatch) {
    const items = extractTaskItems(completedMatch[1]);
    for (const item of items) {
      const task = parseTaskItem(item, "done", "medium");
      if (task) tasks.push(task);
    }
  }

  return tasks;
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
    }
  }

  if (currentItem) items.push(currentItem.trim());
  return items;
}

function parseTaskItem(item: string, status: TaskStatus, priority: TaskPriority): TaskRecord | null {
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

  const isCompleted = item.includes("- [x]");
  const id = `task-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}`;

  return {
    id,
    title,
    description: contextLines.join("\n").trim() || null,
    status: isCompleted ? "done" : status,
    priority,
    assigned_agent_id: assignedAgentId,
    created_by: null,
    parent_task_id: null,
    context,
    tags: [],
    due_date: null,
    started_at: null,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };
}

function parsePendingTasksMd(content: string): TaskRecord[] {
  const tasks: TaskRecord[] = [];

  // Parse In Progress section
  const inProgressMatch = content.match(/## 🔄 In Progress\n([\s\S]*?)(?=\n## [^#]|$)/);
  if (inProgressMatch) {
    const items = extractPendingItems(inProgressMatch[1]);
    for (const item of items) {
      const task = parsePendingItem(item, "in_progress");
      if (task) tasks.push(task);
    }
  }

  // Parse Completed Today section
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

function parsePendingItem(item: string, status: TaskStatus): TaskRecord | null {
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
    assigned_agent_id: assignedAgentId,
    created_by: null,
    parent_task_id: null,
    context: { source: "PENDING_TASKS.md" },
    tags: ["async-task"],
    due_date: null,
    started_at: null,
    completed_at: status === "done" ? (completedAt || new Date().toISOString()) : null,
  };
}

// ============================================================================
// Agent Soul Parsing
// ============================================================================

async function parseAgentSoul(workspacePath: string, agentId: string): Promise<{ description: string | null; heartbeatSchedule: string | null }> {
  const soulPath = path.join(workspacePath, "agents", agentId, "SOUL.md");
  const content = await readFile(soulPath);
  
  if (!content) {
    return { description: null, heartbeatSchedule: null };
  }

  // Extract first paragraph after the title as description
  // Using [\s\S] instead of . with s flag for ES5 compatibility
  const descMatch = content.match(/^# .+?\n\n([\s\S]+?)(?:\n\n|$)/);
  const description = descMatch ? descMatch[1].slice(0, 500) : null;

  // Try to extract heartbeat schedule from cron comments
  const scheduleMatch = content.match(/heartbeat.*?(\d+\s*(?:min|hour|minutes|hours))/i);
  const heartbeatSchedule = scheduleMatch ? scheduleMatch[1] : null;

  return { description, heartbeatSchedule };
}

// ============================================================================
// Main Seeding Logic
// ============================================================================

async function seedDatabase(options: SeedOptions): Promise<void> {
  const { workspacePath, dryRun, verbose, clear } = options;
  const log = verbose ? console.log : () => {};

  log(`\n🌱 OpenClaw → Supabase Seeding Script`);
  log(`   Workspace: ${workspacePath}`);
  log(`   Dry Run: ${dryRun}`);
  log(`   Clear: ${clear}`);
  log(``);

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  if (dryRun) {
    log("📋 DRY RUN — No data will be written\n");
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check workspace exists
  if (!await fileExists(workspacePath)) {
    console.error(`❌ Workspace not found: ${workspacePath}`);
    process.exit(1);
  }

  // ========================================================================
  // Build Agent Records
  // ========================================================================
  
  log("👥 Processing agents...");
  const agents: AgentRecord[] = [];

  for (const def of KNOWN_AGENTS) {
    const soulInfo = await parseAgentSoul(workspacePath, def.id);
    const soulPath = path.join("agents", def.id, "SOUL.md");
    const hasSoul = await fileExists(path.join(workspacePath, soulPath));

    agents.push({
      id: def.id,
      name: def.name,
      display_name: def.displayName,
      emoji: def.emoji,
      domain: def.domain,
      description: soulInfo.description || `${def.displayName} — ${def.domain}`,
      soul_path: hasSoul ? soulPath : null,
      skills: [],
      tools: [],
      status: "offline",
      session_key: `agent:${def.id}:main`,
      last_heartbeat: null,
      current_task_id: null,
      heartbeat_schedule: soulInfo.heartbeatSchedule,
      heartbeat_interval_minutes: null,
    });

    log(`   ✓ ${def.emoji} ${def.displayName}`);
  }

  // ========================================================================
  // Build Task Records
  // ========================================================================
  
  log("\n📝 Processing tasks...");
  const tasks: TaskRecord[] = [];

  // Parse TASKS.md
  const tasksMdPath = path.join(workspacePath, "TASKS.md");
  const tasksMdContent = await readFile(tasksMdPath);
  if (tasksMdContent) {
    const parsedTasks = parseTasksMd(tasksMdContent);
    tasks.push(...parsedTasks);
    log(`   ✓ TASKS.md: ${parsedTasks.length} tasks`);
  } else {
    log(`   ⚠ TASKS.md not found`);
  }

  // Parse PENDING_TASKS.md
  const pendingPath = path.join(workspacePath, "PENDING_TASKS.md");
  const pendingContent = await readFile(pendingPath);
  if (pendingContent) {
    const parsedPending = parsePendingTasksMd(pendingContent);
    tasks.push(...parsedPending);
    log(`   ✓ PENDING_TASKS.md: ${parsedPending.length} tasks`);
  } else {
    log(`   ⚠ PENDING_TASKS.md not found`);
  }

  // ========================================================================
  // Build Activity Records
  // ========================================================================
  
  const activities: ActivityRecord[] = [{
    activity_type: "system_event",
    title: "Database seeded from OpenClaw",
    description: `Seeded ${agents.length} agents and ${tasks.length} tasks`,
    agent_id: null,
    task_id: null,
    message_id: null,
    metadata: { 
      seed_time: new Date().toISOString(),
      agent_count: agents.length,
      task_count: tasks.length,
    },
  }];

  // ========================================================================
  // Summary
  // ========================================================================
  
  log("\n📊 Summary:");
  log(`   Agents: ${agents.length}`);
  log(`   Tasks: ${tasks.length}`);
  log(`   Activities: ${activities.length}`);

  if (dryRun) {
    log("\n✅ Dry run complete. Use --no-dry-run to actually seed.");
    return;
  }

  // ========================================================================
  // Clear Existing Data (if requested)
  // ========================================================================
  
  if (clear) {
    log("\n🗑️  Clearing existing data...");
    
    // Delete in order to respect foreign keys
    await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("agents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    log("   ✓ Cleared agents, tasks, activities");
  }

  // ========================================================================
  // Insert Data
  // ========================================================================
  
  log("\n💾 Inserting data...");

  // Insert agents
  const { error: agentsError, count: agentsCount } = await supabase
    .from("agents")
    .upsert(agents, { onConflict: "id", count: "exact" });

  if (agentsError) {
    console.error(`❌ Failed to insert agents: ${agentsError.message}`);
  } else {
    log(`   ✓ Agents: ${agentsCount} upserted`);
  }

  // Insert tasks
  if (tasks.length > 0) {
    const { error: tasksError, count: tasksCount } = await supabase
      .from("tasks")
      .upsert(tasks, { onConflict: "id", count: "exact" });

    if (tasksError) {
      console.error(`❌ Failed to insert tasks: ${tasksError.message}`);
    } else {
      log(`   ✓ Tasks: ${tasksCount} upserted`);
    }
  }

  // Insert activities
  const { error: activitiesError } = await supabase
    .from("activities")
    .insert(activities);

  if (activitiesError) {
    console.error(`❌ Failed to insert activities: ${activitiesError.message}`);
  } else {
    log(`   ✓ Activities: ${activities.length} inserted`);
  }

  log("\n✅ Seeding complete!");
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    workspacePath: process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME || "~", ".openclaw", "workspace"),
    dryRun: true, // Default to dry run for safety
    verbose: false,
    clear: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--workspace":
        options.workspacePath = args[++i] || options.workspacePath;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-dry-run":
        options.dryRun = false;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--clear":
        options.clear = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: npx tsx scripts/seed-from-openclaw.ts [options]

Options:
  --workspace <path>  Path to OpenClaw workspace (default: ~/.openclaw/workspace)
  --dry-run           Print what would be seeded without writing (default)
  --no-dry-run        Actually write to database
  --verbose, -v       Show detailed output
  --clear             Clear existing data before seeding (CAUTION!)
  --help, -h          Show this help

Environment:
  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anon key
  SUPABASE_SERVICE_ROLE_KEY     Service role key (for admin operations)
  OPENCLAW_WORKSPACE            Default workspace path
`);
        process.exit(0);
    }
  }

  return options;
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    await seedDatabase(options);
  } catch (error) {
    console.error("❌ Seeding failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
