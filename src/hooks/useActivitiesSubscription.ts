"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { subscribeToTable, unsubscribeFromChannel } from "@/lib/supabase/realtime";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  agent_id: string | null;
  task_id: string | null;
  message_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UseActivitiesSubscriptionOptions {
  /** Initial activities data (from server) */
  initialData?: Activity[];
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by activity type */
  activityType?: string;
  /** Maximum number of activities to keep */
  limit?: number;
  /** Callback when activities change */
  onChange?: (activities: Activity[]) => void;
  /** Callback when a new activity is received */
  onNewActivity?: (activity: Activity) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Whether to enable subscription (default: true) */
  enabled?: boolean;
}

interface UseActivitiesSubscriptionResult {
  /** Current activities data (newest first) */
  activities: Activity[];
  /** Whether subscription is active */
  isSubscribed: boolean;
  /** Connection status */
  status: "connecting" | "connected" | "error" | "disconnected";
  /** Last error if any */
  error: Error | null;
  /** Force refresh from server */
  refresh: () => Promise<void>;
  /** Clear all activities */
  clear: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useActivitiesSubscription - Real-time subscription to activities table
 * 
 * Features:
 * - Subscribes to INSERT events (activities are append-only)
 * - Maintains a rolling window of recent activities
 * - Optional filtering by agent or type
 * - Triggers callback on new activity (for toasts/notifications)
 * 
 * Usage:
 * ```tsx
 * const { activities, isSubscribed } = useActivitiesSubscription({
 *   limit: 50,
 *   onNewActivity: (activity) => showToast(activity.title),
 * });
 * ```
 */
export function useActivitiesSubscription(
  options: UseActivitiesSubscriptionOptions = {}
): UseActivitiesSubscriptionResult {
  const {
    initialData = [],
    agentId,
    activityType,
    limit = 100,
    onChange,
    onNewActivity,
    onError,
    enabled = true,
  } = options;

  const [activities, setActivities] = useState<Activity[]>(initialData);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handle real-time changes (mainly INSERTs for activity feed)
  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<Activity>) => {
    if (payload.eventType === "INSERT") {
      const newActivity = payload.new as Activity;

      // Apply filters
      if (agentId && newActivity.agent_id !== agentId) return;
      if (activityType && newActivity.activity_type !== activityType) return;

      // Trigger new activity callback
      onNewActivity?.(newActivity);

      // Add to list and enforce limit
      setActivities((current) => {
        const updated = [newActivity, ...current].slice(0, limit);
        onChange?.(updated);
        return updated;
      });
    }
  }, [agentId, activityType, limit, onChange, onNewActivity]);

  // Fetch fresh data from server
  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (agentId) params.set("agent_id", agentId);
      if (activityType) params.set("type", activityType);
      params.set("limit", String(limit));

      const url = `/api/activities${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch activities: ${res.status}`);
      const data = await res.json();
      const newActivities = data.activities || [];
      setActivities(newActivities);
      onChange?.(newActivities);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh");
      setError(error);
      onError?.(error);
    }
  }, [agentId, activityType, limit, onChange, onError]);

  // Clear activities
  const clear = useCallback(() => {
    setActivities([]);
    onChange?.([]);
  }, [onChange]);

  // Build filter string for subscription
  const buildFilter = useCallback((): string | undefined => {
    if (agentId) {
      return `agent_id=eq.${agentId}`;
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
      // Activities are typically append-only, so we mainly care about INSERTs
      const channel = subscribeToTable<Activity>({
        table: "activities",
        events: ["INSERT"],
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
      setActivities(initialData);
    }
  }, [initialData]);

  return {
    activities,
    isSubscribed,
    status,
    error,
    refresh,
    clear,
  };
}

export default useActivitiesSubscription;
