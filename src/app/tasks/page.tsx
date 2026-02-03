import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TasksKanban } from "./TasksKanban";
import type { Task, Agent, TaskStatus } from "@/types";

export const dynamic = "force-dynamic";

// Define the columns to show and their display order
const KANBAN_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "inbox", title: "Inbox" },
  { status: "assigned", title: "Assigned" },
  { status: "in_progress", title: "In Progress" },
  { status: "review", title: "Review" },
  { status: "done", title: "Done" },
];

export default async function TasksPage() {
  const supabase = await createClient();

  // Fetch tasks and agents in parallel
  const [tasksResult, agentsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false })
      .returns<Task[]>(),
    supabase.from("agents").select("*").order("name").returns<Agent[]>(),
  ]);

  const tasks = tasksResult.data ?? [];
  const agents = agentsResult.data ?? [];

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    inbox: [],
    assigned: [],
    in_progress: [],
    review: [],
    done: [],
    cancelled: [],
  };

  for (const task of tasks) {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    }
  }

  // Create agent lookup map
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <AppShell>
      <PageHeader
        title="Task Queue"
        subtitle="Track work across the squad"
      />

      <TasksKanban
        columns={KANBAN_COLUMNS}
        tasksByStatus={tasksByStatus}
        agents={agents}
        agentMap={agentMap}
      />
    </AppShell>
  );
}
