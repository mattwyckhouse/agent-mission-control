"use client";

import { useState, useCallback, useEffect } from "react";
import { TaskForm } from "./TaskForm";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Agent, TaskPriority, TaskStatus } from "@/types";

interface TaskEditModalProps {
  /** Task to edit (null for create mode) */
  task: Task | null;
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback after save */
  onSave: (task: Task) => void;
  /** Available agents for assignment */
  agents?: Agent[];
}

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_agent_id: string | null;
  due_date: string | null;
  tags: string[];
}

/**
 * TaskEditModal - Modal wrapper for TaskForm
 * 
 * Features:
 * - Create or edit mode based on task prop
 * - Accessible modal with focus trap
 * - API integration for save
 * - Loading and error states
 */
export function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  agents = [],
}: TaskEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onClose]);

  const handleSubmit = useCallback(async (data: TaskFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${task ? "update" : "create"} task`);
      }

      onSave(result.task);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [task, onSave, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  }, [loading, onClose]);

  if (!isOpen) return null;

  const initialValues: Partial<TaskFormData> | undefined = task
    ? {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        assigned_agent_id: task.assigned_agent_id,
        due_date: task.due_date,
        tags: task.tags || [],
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className={cn(
            "absolute top-4 right-4 z-20 p-2 rounded-lg",
            "bg-background/80 backdrop-blur-sm",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-teal/50",
            loading && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Error banner */}
        {error && (
          <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-error/90 text-white text-sm rounded-t-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <TaskForm
          initialValues={initialValues}
          agents={agents}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          mode={task ? "edit" : "create"}
        />
      </div>
    </div>
  );
}

export default TaskEditModal;
