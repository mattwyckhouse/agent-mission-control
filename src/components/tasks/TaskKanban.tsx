"use client";

import { useState, useCallback, useMemo } from "react";
import { DroppableColumn } from "./DroppableColumn";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { TaskEditModal } from "./TaskEditModal";
import { KANBAN_COLUMNS, STATUS_CONFIG, isValidTransition } from "@/lib/tasks/transitions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Task, Agent, TaskStatus } from "@/types";

interface TaskKanbanProps {
  tasks: Task[];
  agents: Agent[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate?: (task: Partial<Task>) => Promise<void>;
  loading?: boolean;
  className?: string;
}

/**
 * TaskKanban - Full drag-and-drop Kanban board
 * 
 * Features:
 * - Columns for each status
 * - Drag-and-drop with validation
 * - Optimistic updates
 * - Task creation and editing
 */
export function TaskKanban({
  tasks,
  agents,
  onTaskUpdate,
  onTaskCreate,
  loading = false,
  className,
}: TaskKanbanProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      inbox: [],
      assigned: [],
      in_progress: [],
      review: [],
      done: [],
      cancelled: [],
    };

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }

    // Sort by priority within each column
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return grouped;
  }, [tasks]);

  // Get dragging task's status
  const draggingTaskStatus = useMemo(() => {
    if (!draggingTaskId) return null;
    const task = tasks.find(t => t.id === draggingTaskId);
    return task?.status ?? null;
  }, [draggingTaskId, tasks]);

  // Get agent name for a task
  const getAgentName = useCallback((agentId: string | null) => {
    if (!agentId) return undefined;
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.emoji} ${agent.display_name}` : undefined;
  }, [agents]);

  // Handle drop
  const handleDrop = useCallback(async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!isValidTransition(task.status, targetStatus)) {
      console.warn(`Invalid transition: ${task.status} → ${targetStatus}`);
      return;
    }

    // Optimistic update handled by parent
    await onTaskUpdate(taskId, { status: targetStatus });
  }, [tasks, onTaskUpdate]);

  // Handle task save from modal
  const handleTaskSave = useCallback((task: Task) => {
    // Refresh will happen via subscription or parent state
    setEditingTask(null);
    setIsCreateModalOpen(false);
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        {onTaskCreate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Task
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-4",
          "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        )}
      >
        {KANBAN_COLUMNS.map((status) => {
          const config = STATUS_CONFIG[status];
          const columnTasks = tasksByStatus[status];

          return (
            <DroppableColumn
              key={status}
              status={status}
              title={config.label}
              count={columnTasks.length}
              onDrop={handleDrop}
              draggingTaskStatus={draggingTaskStatus}
            >
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    agentName={getAgentName(task.assigned_agent_id)}
                    onDragStart={setDraggingTaskId}
                    onDragEnd={() => setDraggingTaskId(null)}
                    onClick={() => setEditingTask(task)}
                  />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </div>

      {/* Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleTaskSave}
        agents={agents}
      />

      {/* Create Modal */}
      <TaskEditModal
        task={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleTaskSave}
        agents={agents}
      />
    </div>
  );
}

export default TaskKanban;
