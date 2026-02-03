import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Task, TaskPriority, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  agentName?: string;
  progress?: {
    current: number;
    total: number;
  };
  onClick?: () => void;
  className?: string;
}

// Priority color mapping
const priorityStyles: Record<TaskPriority, {
  border: string;
  badge: string;
  text: string;
  label: string;
}> = {
  urgent: {
    border: "border-l-[#DE5E57]",
    badge: "bg-[rgba(222,94,87,0.15)]",
    text: "text-[#DE5E57]",
    label: "P0",
  },
  high: {
    border: "border-l-[#F27229]",
    badge: "bg-[rgba(242,114,41,0.15)]",
    text: "text-[#F27229]",
    label: "P1",
  },
  medium: {
    border: "border-l-[#EDB95E]",
    badge: "bg-[rgba(237,185,94,0.15)]",
    text: "text-[#EDB95E]",
    label: "P2",
  },
  low: {
    border: "border-l-[#67AD5C]",
    badge: "bg-[rgba(103,173,92,0.15)]",
    text: "text-[#67AD5C]",
    label: "P3",
  },
};

// Status badge styles
const statusStyles: Record<TaskStatus, {
  bg: string;
  text: string;
  label: string;
}> = {
  inbox: {
    bg: "bg-[rgba(142,146,150,0.15)]",
    text: "text-[#8E9296]",
    label: "Inbox",
  },
  assigned: {
    bg: "bg-[rgba(139,92,246,0.15)]",
    text: "text-[#8B5CF6]",
    label: "Assigned",
  },
  in_progress: {
    bg: "bg-[rgba(242,114,41,0.15)]",
    text: "text-[#F27229]",
    label: "In Progress",
  },
  review: {
    bg: "bg-[rgba(59,130,246,0.15)]",
    text: "text-[#3B82F6]",
    label: "Review",
  },
  done: {
    bg: "bg-[rgba(103,173,92,0.15)]",
    text: "text-[#67AD5C]",
    label: "Done",
  },
  cancelled: {
    bg: "bg-[rgba(78,82,87,0.15)]",
    text: "text-[#4E5257]",
    label: "Cancelled",
  },
};

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format due date
function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 7) return `Due in ${diffDays}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * TaskCard - Kanban-style task card
 * 
 * Shows:
 * - Priority indicator (left border color + badge)
 * - Task title
 * - Assigned agent
 * - Status badge
 * - Created/due date
 * - Progress bar (if provided)
 * 
 * Features:
 * - Glass-morphism design
 * - Color-coded priority border
 * - Hover effects
 * - Click handler for drill-down
 */
export function TaskCard({
  task,
  agentName,
  progress,
  onClick,
  className,
}: TaskCardProps) {
  const priority = priorityStyles[task.priority];
  const status = statusStyles[task.status];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "w-full max-w-[320px] p-3 rounded-lg",
        "bg-card/60 backdrop-blur-md",
        "border border-border",
        // Priority left border
        "border-l-[3px]",
        priority.border,
        // Transitions
        "transition-all duration-200 ease-out",
        // Hover effects
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
        "hover:border-border/80",
        // Cursor
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header row: Title */}
      <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description (if exists, truncated) */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta row: Agent + Priority */}
      <div className="flex items-center justify-between mb-2">
        {agentName ? (
          <span className="text-xs text-muted-foreground">@{agentName}</span>
        ) : task.assigned_agent_id ? (
          <span className="text-xs text-muted-foreground/70">Assigned</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Unassigned</span>
        )}
        
        {/* Priority badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            priority.badge,
            priority.text
          )}
        >
          {priority.label}
        </span>
      </div>

      {/* Date row */}
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground/70">
        <span>Created: {formatDate(task.created_at)}</span>
        {task.due_date && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span className={cn(isOverdue && "text-[#DE5E57]")}>
              {formatDueDate(task.due_date)}
            </span>
          </>
        )}
      </div>

      {/* Tags (if any) */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 rounded text-[10px] bg-accent text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground/70">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress bar (if provided) */}
      {progress && (
        <div className="mt-2">
          <ProgressBar
            value={progress.current}
            max={progress.total}
            size="sm"
            className="mb-1"
          />
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            Step {progress.current}/{progress.total}
          </span>
        </div>
      )}

      {/* Status badge (bottom right) */}
      <div className="flex justify-end mt-2">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            status.bg,
            status.text
          )}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

export default TaskCard;
