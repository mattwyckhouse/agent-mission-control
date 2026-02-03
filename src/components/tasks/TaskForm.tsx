"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/cards/GlassCard";
import { X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, Agent } from "@/types";

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_agent_id: string | null;
  due_date: string | null;
  tags: string[];
}

interface TaskFormProps {
  /** Initial values (for editing) */
  initialValues?: Partial<TaskFormData>;
  /** Available agents for assignment */
  agents?: Agent[];
  /** Callback on form submission */
  onSubmit: (data: TaskFormData) => Promise<void>;
  /** Callback on cancel */
  onCancel: () => void;
  /** Whether submitting */
  loading?: boolean;
  /** Form mode */
  mode?: "create" | "edit";
  /** Additional class names */
  className?: string;
}

const DEFAULT_VALUES: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "inbox",
  assigned_agent_id: null,
  due_date: null,
  tags: [],
};

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "P0 - Urgent", color: "text-error" },
  { value: "high", label: "P1 - High", color: "text-brand-orange" },
  { value: "medium", label: "P2 - Medium", color: "text-warning" },
  { value: "low", label: "P3 - Low", color: "text-success" },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * TaskForm - Create or edit a task
 * 
 * Features:
 * - Title and description
 * - Priority selection (P0-P3)
 * - Status selection
 * - Agent assignment
 * - Due date picker
 * - Tag management
 */
export function TaskForm({
  initialValues,
  agents = [],
  onSubmit,
  onCancel,
  loading = false,
  mode = "create",
  className,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  const updateField = useCallback(<K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      updateField("tags", [...formData.tags, tag]);
      setTagInput("");
    }
  }, [tagInput, formData.tags, updateField]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateField("tags", formData.tags.filter(t => t !== tagToRemove));
  }, [formData.tags, updateField]);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    await onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      due_date: formData.due_date || null,
    });
  }, [formData, validate, onSubmit]);

  const inputClassName = cn(
    "w-full px-3 py-2 rounded-lg text-sm",
    "bg-background border border-border",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
  );

  const selectClassName = cn(
    inputClassName,
    "appearance-none cursor-pointer"
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      <GlassCard variant="glass-2" padding="lg">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          {mode === "create" ? "Create Task" : "Edit Task"}
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Task title..."
              className={cn(inputClassName, errors.title && "border-error")}
              disabled={loading}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-error">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Task description..."
              rows={3}
              className={inputClassName}
              disabled={loading}
            />
          </div>

          {/* Priority + Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => updateField("priority", e.target.value as TaskPriority)}
                className={selectClassName}
                disabled={loading}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value as TaskStatus)}
                className={selectClassName}
                disabled={loading}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Agent + Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assigned Agent */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Assign to
              </label>
              <select
                value={formData.assigned_agent_id || ""}
                onChange={(e) => updateField("assigned_agent_id", e.target.value || null)}
                className={selectClassName}
                disabled={loading}
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.emoji} {agent.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date || ""}
                onChange={(e) => updateField("due_date", e.target.value || null)}
                className={inputClassName}
                disabled={loading}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className={cn(inputClassName, "flex-1")}
                disabled={loading}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addTag}
                disabled={loading || !tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-foreground"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : (
              mode === "create" ? "Create Task" : "Save Changes"
            )}
          </Button>
        </div>
      </GlassCard>
    </form>
  );
}

export default TaskForm;
