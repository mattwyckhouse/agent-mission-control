"use client";

import { useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { canDropInColumn, STATUS_CONFIG } from "@/lib/tasks/transitions";
import type { TaskStatus } from "@/types";

interface DroppableColumnProps {
  status: TaskStatus;
  title: string;
  count: number;
  children: ReactNode;
  onDrop: (taskId: string, targetStatus: TaskStatus) => void;
  draggingTaskStatus?: TaskStatus | null;
  className?: string;
}

/**
 * DroppableColumn - Kanban column with drop zone
 * 
 * Features:
 * - Validates drops based on transition rules
 * - Visual feedback for valid/invalid drop targets
 * - Smooth animations
 */
export function DroppableColumn({
  status,
  title,
  count,
  children,
  onDrop,
  draggingTaskStatus,
  className,
}: DroppableColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const config = STATUS_CONFIG[status];
  const canDrop = draggingTaskStatus ? canDropInColumn(draggingTaskStatus, status) : true;
  const isValidTarget = isDragOver && canDrop;
  const isInvalidTarget = isDragOver && !canDrop;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (canDrop) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
    setIsDragOver(true);
  }, [canDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!canDrop) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.taskId) {
        onDrop(data.taskId, status);
      }
    } catch {
      console.error("Invalid drop data");
    }
  }, [canDrop, onDrop, status]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        // Base styles
        "flex flex-col",
        "min-w-[280px] max-w-[320px] w-full",
        "rounded-xl overflow-hidden",
        "bg-card/40 backdrop-blur-md",
        "border transition-all duration-200",
        // Normal state
        !isDragOver && "border-border",
        // Valid drop target
        isValidTarget && "border-brand-teal border-2 bg-brand-teal/5",
        // Invalid drop target
        isInvalidTarget && "border-error/50 bg-error/5",
        className
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-3 py-2.5",
          "border-b border-border",
          config.bgColor
        )}
      >
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              status === "inbox" && "bg-muted-foreground",
              status === "assigned" && "bg-purple-500",
              status === "in_progress" && "bg-brand-orange",
              status === "review" && "bg-brand-teal",
              status === "done" && "bg-success",
              status === "cancelled" && "bg-error"
            )}
            aria-hidden="true"
          />
          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        {/* Count badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded-full",
            "text-xs font-medium tabular-nums",
            "bg-muted/50 text-muted-foreground"
          )}
        >
          {count}
        </span>
      </div>

      {/* Drop indicator */}
      {isValidTarget && (
        <div className="px-2 py-1 bg-brand-teal/10 text-brand-teal text-xs text-center">
          Drop to move here
        </div>
      )}
      {isInvalidTarget && (
        <div className="px-2 py-1 bg-error/10 text-error text-xs text-center">
          Cannot move here
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-240px)]">
        {children}
      </div>
    </div>
  );
}

export default DroppableColumn;
