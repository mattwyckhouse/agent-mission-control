"use client";

import { useState, useMemo } from "react";
import { TaskCard } from "@/components/cards/TaskCard";
import { KanbanColumn, KanbanBoard } from "@/components/tasks/KanbanColumn";
import { TaskFilters, type TaskFilterValues } from "@/components/tasks/TaskFilters";
import type { Task, Agent, TaskStatus } from "@/types";

interface TasksKanbanProps {
  columns: { status: TaskStatus; title: string }[];
  tasksByStatus: Record<TaskStatus, Task[]>;
  agents: Agent[];
  agentMap: Map<string, Agent>;
}

// Check if a date is within range
function isWithinDateRange(
  dateStr: string,
  range: TaskFilterValues["dateRange"]
): boolean {
  if (range === "all") return true;

  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today":
      return date >= startOfToday;
    case "week": {
      const weekAgo = new Date(startOfToday);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    case "month": {
      const monthAgo = new Date(startOfToday);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }
    default:
      return true;
  }
}

export function TasksKanban({
  columns,
  tasksByStatus,
  agents,
  agentMap,
}: TasksKanbanProps) {
  const [filters, setFilters] = useState<TaskFilterValues>({
    agentId: null,
    priority: null,
    dateRange: "all",
    search: "",
  });

  // Filter tasks based on current filters
  const filteredTasksByStatus = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      inbox: [],
      assigned: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    };

    for (const [status, tasks] of Object.entries(tasksByStatus)) {
      result[status as TaskStatus] = tasks.filter((task) => {
        // Agent filter
        if (filters.agentId && task.assigned_agent_id !== filters.agentId) {
          return false;
        }

        // Priority filter
        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }

        // Date range filter
        if (!isWithinDateRange(task.created_at, filters.dateRange)) {
          return false;
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const titleMatch = task.title.toLowerCase().includes(searchLower);
          const descMatch = task.description?.toLowerCase().includes(searchLower);
          const tagMatch = task.tags?.some((tag) =>
            tag.toLowerCase().includes(searchLower)
          );
          if (!titleMatch && !descMatch && !tagMatch) {
            return false;
          }
        }

        return true;
      });
    }

    return result;
  }, [tasksByStatus, filters]);

  // Count total filtered tasks
  const totalFilteredTasks = Object.values(filteredTasksByStatus).reduce(
    (sum, tasks) => sum + tasks.length,
    0
  );

  const totalTasks = Object.values(tasksByStatus).reduce(
    (sum, tasks) => sum + tasks.length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TaskFilters
          filters={filters}
          onFilterChange={setFilters}
          agents={agents}
        />
        <span className="text-sm text-[#6B7075]">
          {totalFilteredTasks === totalTasks
            ? `${totalTasks} tasks`
            : `${totalFilteredTasks} of ${totalTasks} tasks`}
        </span>
      </div>

      {/* Kanban board */}
      <KanbanBoard>
        {columns.map(({ status, title }) => {
          const tasks = filteredTasksByStatus[status];
          return (
            <KanbanColumn
              key={status}
              title={title}
              status={status}
              count={tasks.length}
            >
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-[#4E5257]">
                  No tasks
                </div>
              ) : (
                tasks.map((task) => {
                  const agent = task.assigned_agent_id
                    ? agentMap.get(task.assigned_agent_id)
                    : undefined;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      agentName={agent?.display_name}
                    />
                  );
                })
              )}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>
    </div>
  );
}

export default TasksKanban;
