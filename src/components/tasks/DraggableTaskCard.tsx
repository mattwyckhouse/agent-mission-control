"use client";

import { useState, useCallback } from "react";
import { TaskCard } from "@/components/cards/TaskCard";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface DraggableTaskCardProps {
  task: Task;
  agentName?: string;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * DraggableTaskCard - TaskCard with drag-and-drop support
 * 
 * Uses native HTML5 drag and drop API.
 */
export function DraggableTaskCard({
  task,
  agentName,
  onDragStart,
  onDragEnd,
  onClick,
  className,
}: DraggableTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    
    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify({
      taskId: task.id,
      sourceStatus: task.status,
    }));
    e.dataTransfer.effectAllowed = "move";
    
    onDragStart?.(task.id);
  }, [task.id, task.status, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        "transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <TaskCard
        task={task}
        agentName={agentName}
        onClick={onClick}
      />
    </div>
  );
}

export default DraggableTaskCard;
