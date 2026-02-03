"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { subscribeToTable, unsubscribeFromChannel } from "@/lib/supabase/realtime";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Task, TaskStatus } from "@/types";

interface UseTasksSubscriptionOptions {
  /** Initial tasks data (from server) */
  initialData?: Task[];
  /** Filter by status */
  status?: TaskStatus | TaskStatus[];
  /** Filter by agent ID */
  agentId?: string;
  /** Callback when tasks change */
  onChange?: (tasks: Task[]) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Whether to enable subscription (default: true) */
  enabled?: boolean;
}

interface UseTasksSubscriptionResult {
  /** Current tasks data */
  tasks: Task[];
  /** Tasks grouped by status (for Kanban) */
  tasksByStatus: Record<TaskStatus, Task[]>;
  /** Whether subscription is active */
  isSubscribed: boolean;
  /** Connection status */
  status: "connecting" | "connected" | "error" | "disconnected";
  /** Last error if any */
  error: Error | null;
  /** Force refresh from server */
  refresh: () => Promise<void>;
}

const ALL_STATUSES: TaskStatus[] = ["inbox", "assigned", "in_progress", "review", "done", "cancelled"];

/**
 * Group tasks by status for Kanban view
 */
function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    inbox: [],
    assigned: [],
    in_progress: [],
    review: [],
    done: [],
    cancelled: [],
  };

  for (const task of tasks) {
    if (groups[task.status]) {
      groups[task.status].push(task);
    }
  }

  // Sort each group by priority then created_at
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  for (const status of ALL_STATUSES) {
    groups[status].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return groups;
}

/**
 * useTasksSubscription - Real-time subscription to tasks table
 * 
 * Features:
 * - Subscribes to INSERT, UPDATE, DELETE events
 * - Optional filtering by status or agent
 * - Provides tasks grouped by status for Kanban
 * - Handles reconnection automatically
 * 
 * Usage:
 * ```tsx
 * const { tasks, tasksByStatus, isSubscribed } = useTasksSubscription({
 *   initialData: serverTasks,
 *   agentId: "forge", // optional filter
 * });
 * ```
 */
export function useTasksSubscription(
  options: UseTasksSubscriptionOptions = {}
): UseTasksSubscriptionResult {
  const {
    initialData = [],
    status: statusFilter,
    agentId,
    onChange,
    onError,
    enabled = true,
  } = options;

  const [tasks, setTasks] = useState<Task[]>(initialData);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Filter tasks based on options
  const filterTasks = useCallback((allTasks: Task[]): Task[] => {
    let filtered = allTasks;

    // Filter by status
    if (statusFilter) {
      const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
      filtered = filtered.filter((t) => statuses.includes(t.status));
    }

    // Filter by agent
    if (agentId) {
      filtered = filtered.filter((t) => t.assigned_agent_id === agentId);
    }

    return filtered;
  }, [statusFilter, agentId]);

  // Handle real-time changes
  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<Task>) => {
    setTasks((current) => {
      let updated: Task[];

      switch (payload.eventType) {
        case "INSERT":
          updated = [...current, payload.new as Task];
          break;

        case "UPDATE":
          updated = current.map((task) =>
            task.id === (payload.new as Task).id
              ? (payload.new as Task)
              : task
          );
          break;

        case "DELETE":
          updated = current.filter(
            (task) => task.id !== (payload.old as Task).id
          );
          break;

        default:
          return current;
      }

      // Apply filters
      const filtered = filterTasks(updated);
      onChange?.(filtered);
      return updated;
    });
  }, [filterTasks, onChange]);

  // Fetch fresh data from server
  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (agentId) params.set("agent_id", agentId);
      if (statusFilter) {
        const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        params.set("status", statuses.join(","));
      }

      const url = `/api/tasks${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      onChange?.(data.tasks || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh");
      setError(error);
      onError?.(error);
    }
  }, [agentId, statusFilter, onChange, onError]);

  // Build filter string for subscription
  const buildFilter = useCallback((): string | undefined => {
    if (agentId) {
      return `assigned_agent_id=eq.${agentId}`;
    }
    return undefined;
  }, [agentId]);

  // Set up subscription
  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    try {
      const channel = subscribeToTable<Task>({
        table: "tasks",
        events: ["INSERT", "UPDATE", "DELETE"],
        filter: buildFilter(),
        onData: handleChange,
        onError: (err) => {
          setError(err);
          setStatus("error");
          onError?.(err);
        },
        onStatusChange: (channelStatus) => {
          if (channelStatus === "SUBSCRIBED") {
            setIsSubscribed(true);
            setStatus("connected");
            setError(null);
          } else if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") {
            setIsSubscribed(false);
            setStatus("error");
          } else if (channelStatus === "CLOSED") {
            setIsSubscribed(false);
            setStatus("disconnected");
          }
        },
      });

      channelRef.current = channel;

    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to subscribe");
      setError(error);
      setStatus("error");
      onError?.(error);
    }

    return () => {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current).catch(console.error);
        channelRef.current = null;
        setIsSubscribed(false);
        setStatus("disconnected");
      }
    };
  }, [enabled, buildFilter, handleChange, onError]);

  // Update local state when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      setTasks(initialData);
    }
  }, [initialData]);

  // Compute filtered tasks and grouped tasks
  const filteredTasks = filterTasks(tasks);
  const tasksByStatus = groupByStatus(filteredTasks);

  return {
    tasks: filteredTasks,
    tasksByStatus,
    isSubscribed,
    status,
    error,
    refresh,
  };
}

export default useTasksSubscription;
