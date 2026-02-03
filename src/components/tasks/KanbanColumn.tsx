import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  count: number;
  children: ReactNode;
  className?: string;
}

// Status configuration for column headers
const statusConfig: Record<TaskStatus, {
  bg: string;
  border: string;
  dot: string;
}> = {
  inbox: {
    bg: "bg-[rgba(142,146,150,0.1)]",
    border: "border-[#8E9296]/30",
    dot: "bg-[#8E9296]",
  },
  assigned: {
    bg: "bg-[rgba(139,92,246,0.1)]",
    border: "border-[#8B5CF6]/30",
    dot: "bg-[#8B5CF6]",
  },
  in_progress: {
    bg: "bg-[rgba(242,114,41,0.1)]",
    border: "border-[#F27229]/30",
    dot: "bg-[#F27229]",
  },
  review: {
    bg: "bg-[rgba(59,130,246,0.1)]",
    border: "border-[#3B82F6]/30",
    dot: "bg-[#3B82F6]",
  },
  done: {
    bg: "bg-[rgba(103,173,92,0.1)]",
    border: "border-[#67AD5C]/30",
    dot: "bg-[#67AD5C]",
  },
  cancelled: {
    bg: "bg-[rgba(78,82,87,0.1)]",
    border: "border-[#4E5257]/30",
    dot: "bg-[#4E5257]",
  },
};

/**
 * KanbanColumn - Container for a column of tasks
 * 
 * Features:
 * - Color-coded header by status
 * - Task count badge
 * - Scrollable content area
 * - Glass-morphism design
 */
export function KanbanColumn({
  title,
  status,
  count,
  children,
  className,
}: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        // Base styles
        "flex flex-col",
        "min-w-[280px] max-w-[320px] w-full",
        "rounded-xl overflow-hidden",
        "bg-[rgba(17,18,20,0.4)] backdrop-blur-md",
        "border border-[rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-3 py-2.5",
          "border-b border-[rgba(255,255,255,0.06)]",
          config.bg
        )}
      >
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              config.dot
            )}
            aria-hidden="true"
          />
          {/* Title */}
          <h3 className="text-sm font-semibold text-[#E8E9EA] uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        {/* Count badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded-full",
            "text-xs font-medium tabular-nums",
            "bg-[rgba(255,255,255,0.08)] text-[#9FA3A8]"
          )}
        >
          {count}
        </span>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-240px)]">
        {children}
      </div>
    </div>
  );
}

/**
 * KanbanBoard - Container for the full kanban layout
 */
export function KanbanBoard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4",
        "scrollbar-thin scrollbar-thumb-[#4E5257] scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

export default KanbanColumn;
