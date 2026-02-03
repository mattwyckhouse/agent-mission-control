#!/usr/bin/env npx tsx
/**
 * Seed Demo Tasks
 * 
 * Creates realistic sample tasks for the Mission Control dashboard.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo tasks with realistic content
const DEMO_TASKS = [
  // Inbox tasks
  {
    title: "Review Q4 security audit findings",
    description: "External security team delivered audit report. Need to prioritize remediation items.",
    status: "inbox",
    priority: "high",
    tags: ["security", "audit", "q4"],
  },
  {
    title: "Update investor presentation for board meeting",
    description: "Board meeting next week. Need slides on market expansion and technical roadmap.",
    status: "inbox", 
    priority: "urgent",
    tags: ["board", "presentation"],
  },
  {
    title: "Respond to partnership inquiry from ACME Corp",
    description: "Received inbound about potential integration partnership. Needs initial assessment.",
    status: "inbox",
    priority: "medium",
    tags: ["partnerships", "business-dev"],
  },

  // Assigned tasks
  {
    title: "Draft blog post on AI agent architectures",
    description: "Technical deep-dive for developer blog. Cover multi-agent coordination patterns.",
    status: "assigned",
    priority: "medium",
    tags: ["content", "technical", "blog"],
  },
  {
    title: "Schedule interviews for Staff Engineer role",
    description: "5 candidates in pipeline. Coordinate with team leads on availability.",
    status: "assigned",
    priority: "high",
    tags: ["hiring", "engineering"],
  },

  // In Progress tasks
  {
    title: "Mission Control Dashboard - Phase 4",
    description: "Polish and real functionality. Light mode fixes, task data, charts.",
    status: "in_progress",
    priority: "high",
    tags: ["dashboard", "mission-control", "phase-4"],
  },
  {
    title: "Prepare Singapore trip itinerary",
    description: "Feb 8-16 trip. Hotel confirmed, need restaurant reservations and activities.",
    status: "in_progress",
    priority: "medium",
    tags: ["travel", "singapore"],
  },
  {
    title: "Review and merge open PRs",
    description: "3 PRs waiting for review. Run tests, check coverage, approve or request changes.",
    status: "in_progress",
    priority: "medium",
    tags: ["code-review", "github"],
  },

  // Review tasks
  {
    title: "Finalize 2026 roadmap document",
    description: "Product roadmap needs final review before sharing with team.",
    status: "review",
    priority: "high",
    tags: ["roadmap", "planning", "2026"],
  },
  {
    title: "Approve marketing campaign copy",
    description: "New campaign launching next month. Copy deck needs sign-off.",
    status: "review",
    priority: "medium",
    tags: ["marketing", "copy"],
  },

  // Done tasks (recent completions)
  {
    title: "Complete Phase 3 of Mission Control",
    description: "Agent controls, task management, cost analytics, notifications, search. 222 tests passing.",
    status: "done",
    priority: "high",
    tags: ["dashboard", "mission-control", "phase-3"],
  },
  {
    title: "Send travel schedule to Karissa",
    description: "Sent email with S4x26, Embedded World, RSA, Escar dates.",
    status: "done",
    priority: "medium",
    tags: ["travel", "email"],
  },
  {
    title: "Fix cron job configuration",
    description: "Jobs needed enabled: true explicitly. Klaus heartbeat configured.",
    status: "done",
    priority: "high",
    tags: ["cron", "config", "fix"],
  },
  {
    title: "Review Phase 2 test results",
    description: "Aegis ran full test suite. 133 tests passing, E2E all green.",
    status: "done",
    priority: "medium",
    tags: ["testing", "qa", "phase-2"],
  },
];

async function seedTasks() {
  console.log("🌱 Seeding demo tasks...\n");

  // First, get agent IDs
  const { data: agents } = await supabase.from("agents").select("id, name");
  const agentMap = new Map(agents?.map(a => [a.name, a.id]) || []);

  // Assign some tasks to agents
  const agentAssignments: Record<string, string> = {
    "Draft blog post on AI agent architectures": "herald",
    "Mission Control Dashboard - Phase 4": "forge",
    "Prepare Singapore trip itinerary": "pathfinder",
    "Review and merge open PRs": "forge",
    "Complete Phase 3 of Mission Control": "klaus",
    "Review Phase 2 test results": "aegis",
  };

  const tasksToInsert = DEMO_TASKS.map(task => {
    const agentName = agentAssignments[task.title];
    const agentId = agentName ? agentMap.get(agentName) : null;
    
    return {
      ...task,
      assigned_agent_id: agentId,
      created_by: "human",
      context: {},
      completed_at: task.status === "done" ? new Date().toISOString() : null,
      started_at: ["in_progress", "review", "done"].includes(task.status) 
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
    };
  });

  // Clear existing tasks first
  console.log("🗑️  Clearing existing tasks...");
  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .not("id", "is", null);
  
  if (deleteError) {
    console.error("Failed to clear tasks:", deleteError.message);
  }

  // Insert new tasks
  console.log("💾 Inserting demo tasks...");
  const { data, error } = await supabase
    .from("tasks")
    .insert(tasksToInsert)
    .select();

  if (error) {
    console.error("Failed to insert tasks:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ Created ${data?.length || 0} demo tasks`);
  
  // Summary by status
  const byStatus: Record<string, number> = {};
  for (const task of DEMO_TASKS) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
  }
  console.log("\n📊 Tasks by status:");
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`   ${status}: ${count}`);
  }
}

seedTasks().catch(console.error);
