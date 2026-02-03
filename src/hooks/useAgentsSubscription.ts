"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { subscribeToTable, unsubscribeFromChannel } from "@/lib/supabase/realtime";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Agent } from "@/types";

interface UseAgentsSubscriptionOptions {
  /** Initial agents data (from server) */
  initialData?: Agent[];
  /** Callback when agents change */
  onChange?: (agents: Agent[]) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Whether to enable subscription (default: true) */
  enabled?: boolean;
}

interface UseAgentsSubscriptionResult {
  /** Current agents data */
  agents: Agent[];
  /** Whether subscription is active */
  isSubscribed: boolean;
  /** Connection status */
  status: "connecting" | "connected" | "error" | "disconnected";
  /** Last error if any */
  error: Error | null;
  /** Force refresh from server */
  refresh: () => Promise<void>;
}

/**
 * useAgentsSubscription - Real-time subscription to agents table
 * 
 * Features:
 * - Subscribes to INSERT, UPDATE, DELETE events
 * - Maintains local state with optimistic updates
 * - Handles reconnection automatically
 * - Provides manual refresh capability
 * 
 * Usage:
 * ```tsx
 * const { agents, isSubscribed, status } = useAgentsSubscription({
 *   initialData: serverAgents,
 * });
 * ```
 */
export function useAgentsSubscription(
  options: UseAgentsSubscriptionOptions = {}
): UseAgentsSubscriptionResult {
  const {
    initialData = [],
    onChange,
    onError,
    enabled = true,
  } = options;

  const [agents, setAgents] = useState<Agent[]>(initialData);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Update agents and notify callback
  const updateAgents = useCallback((newAgents: Agent[]) => {
    setAgents(newAgents);
    onChange?.(newAgents);
  }, [onChange]);

  // Handle real-time changes
  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<Agent>) => {
    setAgents((current) => {
      let updated: Agent[];

      switch (payload.eventType) {
        case "INSERT":
          // Add new agent
          updated = [...current, payload.new as Agent];
          break;

        case "UPDATE":
          // Update existing agent
          updated = current.map((agent) =>
            agent.id === (payload.new as Agent).id
              ? (payload.new as Agent)
              : agent
          );
          break;

        case "DELETE":
          // Remove agent
          updated = current.filter(
            (agent) => agent.id !== (payload.old as Agent).id
          );
          break;

        default:
          return current;
      }

      // Sort by name
      updated.sort((a, b) => a.name.localeCompare(b.name));
      
      // Notify callback
      onChange?.(updated);
      
      return updated;
    });
  }, [onChange]);

  // Fetch fresh data from server
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
      const data = await res.json();
      updateAgents(data.agents || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to refresh");
      setError(error);
      onError?.(error);
    }
  }, [updateAgents, onError]);

  // Set up subscription
  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    try {
      const channel = subscribeToTable<Agent>({
        table: "agents",
        events: ["INSERT", "UPDATE", "DELETE"],
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

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current).catch(console.error);
        channelRef.current = null;
        setIsSubscribed(false);
        setStatus("disconnected");
      }
    };
  }, [enabled, handleChange, onError]);

  // Update local state when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      setAgents(initialData);
    }
  }, [initialData]);

  return {
    agents,
    isSubscribed,
    status,
    error,
    refresh,
  };
}

export default useAgentsSubscription;
