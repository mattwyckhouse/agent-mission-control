/**
 * Task Status Transitions
 * 
 * Defines valid status transitions for tasks and utilities
 * for managing task state in the Kanban board.
 * 
 * @module tasks/transitions
 */

import type { TaskStatus } from "@/types";

// ============================================================================
// Valid Transitions
// ============================================================================

/**
 * Map of valid next statuses for each status
 */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  inbox: ["assigned", "cancelled"],
  assigned: ["in_progress", "inbox", "cancelled"],
  in_progress: ["review", "done", "assigned", "cancelled"],
  review: ["done", "in_progress", "cancelled"],
  done: ["in_progress"], // Can reopen if needed
  cancelled: ["inbox"], // Can restore to inbox
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true; // No change is always valid
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next statuses for a given status
 */
export function getValidNextStatuses(status: TaskStatus): TaskStatus[] {
  return VALID_TRANSITIONS[status] || [];
}

// ============================================================================
// Status Metadata
// ============================================================================

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  canAssign: boolean;
  canDrag: boolean;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  inbox: {
    label: "Inbox",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    description: "New tasks waiting to be triaged",
    canAssign: true,
    canDrag: true,
  },
  assigned: {
    label: "Assigned",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    description: "Assigned to an agent, waiting to start",
    canAssign: true,
    canDrag: true,
  },
  in_progress: {
    label: "In Progress",
    color: "text-brand-orange",
    bgColor: "bg-brand-orange/10",
    description: "Currently being worked on",
    canAssign: true,
    canDrag: true,
  },
  review: {
    label: "Review",
    color: "text-brand-teal",
    bgColor: "bg-brand-teal/10",
    description: "Completed, awaiting review",
    canAssign: true,
    canDrag: true,
  },
  done: {
    label: "Done",
    color: "text-success",
    bgColor: "bg-success/10",
    description: "Completed and approved",
    canAssign: false,
    canDrag: true,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-error",
    bgColor: "bg-error/10",
    description: "Cancelled or abandoned",
    canAssign: false,
    canDrag: true,
  },
};

// ============================================================================
// Transition Effects
// ============================================================================

export interface TransitionEffect {
  setStartedAt?: boolean;
  setCompletedAt?: boolean;
  clearCompletedAt?: boolean;
}

/**
 * Get side effects for a status transition
 */
export function getTransitionEffects(
  from: TaskStatus,
  to: TaskStatus
): TransitionEffect {
  const effects: TransitionEffect = {};

  // Starting work
  if (to === "in_progress" && from !== "in_progress") {
    effects.setStartedAt = true;
  }

  // Completing
  if (to === "done" && from !== "done") {
    effects.setCompletedAt = true;
  }

  // Reopening
  if (from === "done" && to !== "done") {
    effects.clearCompletedAt = true;
  }

  return effects;
}

// ============================================================================
// Kanban Column Order
// ============================================================================

/**
 * Default column order for Kanban view
 */
export const KANBAN_COLUMNS: TaskStatus[] = [
  "inbox",
  "assigned",
  "in_progress",
  "review",
  "done",
];

/**
 * Columns that are hidden by default (can be shown)
 */
export const HIDDEN_COLUMNS: TaskStatus[] = ["cancelled"];

/**
 * All columns in display order
 */
export const ALL_COLUMNS: TaskStatus[] = [...KANBAN_COLUMNS, ...HIDDEN_COLUMNS];

// ============================================================================
// Drag and Drop Helpers
// ============================================================================

export interface DragItem {
  taskId: string;
  sourceStatus: TaskStatus;
  index: number;
}

export interface DropResult {
  taskId: string;
  sourceStatus: TaskStatus;
  targetStatus: TaskStatus;
  targetIndex: number;
}

/**
 * Check if a task can be dropped in a column
 */
export function canDropInColumn(
  sourceStatus: TaskStatus,
  targetStatus: TaskStatus
): boolean {
  return isValidTransition(sourceStatus, targetStatus);
}

/**
 * Calculate optimistic updates for a drag operation
 */
export function calculateOptimisticUpdate(
  tasks: Record<TaskStatus, { id: string }[]>,
  result: DropResult
): Record<TaskStatus, { id: string }[]> {
  const { taskId, sourceStatus, targetStatus, targetIndex } = result;

  // Clone the tasks object
  const updated = { ...tasks };
  updated[sourceStatus] = [...tasks[sourceStatus]];
  updated[targetStatus] = [...tasks[targetStatus]];

  // Find and remove from source
  const sourceIndex = updated[sourceStatus].findIndex(t => t.id === taskId);
  if (sourceIndex !== -1) {
    updated[sourceStatus].splice(sourceIndex, 1);
  }

  // Insert at target position
  if (sourceStatus === targetStatus) {
    // Reordering within same column
    updated[targetStatus].splice(targetIndex, 0, { id: taskId });
  } else {
    // Moving to different column
    updated[targetStatus].splice(targetIndex, 0, { id: taskId });
  }

  return updated;
}

// ============================================================================
// Tests Export
// ============================================================================

export const __test__ = {
  VALID_TRANSITIONS,
  STATUS_CONFIG,
  KANBAN_COLUMNS,
};
