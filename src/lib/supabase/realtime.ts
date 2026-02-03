/**
 * Supabase Realtime Client Configuration
 * 
 * Sets up real-time subscriptions for Mission Control tables.
 * Handles connection, reconnection, and event broadcasting.
 * 
 * @module supabase/realtime
 */

import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type TableName = "agents" | "tasks" | "activities" | "ralph_builds";

export type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SubscriptionConfig<T extends { [key: string]: any } = { [key: string]: any }> {
  /** Table to subscribe to */
  table: TableName;
  /** Event types to listen for (default: all) */
  events?: ChangeEvent[];
  /** Optional filter (e.g., "agent_id=eq.forge") */
  filter?: string;
  /** Callback when data changes */
  onData: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback when subscription status changes */
  onStatusChange?: (status: string) => void;
}

export interface RealtimeManager {
  /** Subscribe to a table */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: <T extends { [key: string]: any }>(config: SubscriptionConfig<T>) => RealtimeChannel;
  /** Unsubscribe from a channel */
  unsubscribe: (channel: RealtimeChannel) => Promise<void>;
  /** Unsubscribe from all channels */
  unsubscribeAll: () => Promise<void>;
  /** Get connection status */
  getStatus: () => "connected" | "connecting" | "disconnected" | "error";
}

// ============================================================================
// Singleton Client
// ============================================================================

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Get or create the browser Supabase client for real-time subscriptions
 */
export function getRealtimeClient() {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

// ============================================================================
// Subscription Helpers
// ============================================================================

/**
 * Generate a unique channel name for a subscription
 */
function getChannelName(table: TableName, filter?: string): string {
  const base = `realtime:${table}`;
  return filter ? `${base}:${filter}` : base;
}

/**
 * Subscribe to real-time changes on a table
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToTable<T extends { [key: string]: any } = { [key: string]: any }>(
  config: SubscriptionConfig<T>
): RealtimeChannel {
  const client = getRealtimeClient();
  const channelName = getChannelName(config.table, config.filter);

  // Check if already subscribed
  if (activeChannels.has(channelName)) {
    console.warn(`[Realtime] Already subscribed to ${channelName}`);
    return activeChannels.get(channelName)!;
  }

  const events = config.events || ["*"];
  
  // Create the channel
  const channel = client.channel(channelName);

  // Add listeners for each event type
  for (const event of events) {
    const pgConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: "public",
      table: config.table,
    };

    if (config.filter) {
      pgConfig.filter = config.filter;
    }

    channel.on(
      "postgres_changes",
      pgConfig,
      (payload: RealtimePostgresChangesPayload<T>) => {
        config.onData(payload);
      }
    );
  }

  // Subscribe and handle status changes
  channel.subscribe((status: string) => {
    if (config.onStatusChange) {
      config.onStatusChange(status);
    }

    if (status === "SUBSCRIBED") {
      console.log(`[Realtime] Subscribed to ${channelName}`);
      activeChannels.set(channelName, channel);
    } else if (status === "CHANNEL_ERROR") {
      console.error(`[Realtime] Error subscribing to ${channelName}`);
      if (config.onError) {
        config.onError(new Error(`Failed to subscribe to ${channelName}`));
      }
    } else if (status === "TIMED_OUT") {
      console.warn(`[Realtime] Subscription to ${channelName} timed out`);
      if (config.onError) {
        config.onError(new Error(`Subscription to ${channelName} timed out`));
      }
    }
  });

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeFromChannel(channel: RealtimeChannel): Promise<void> {
  const client = getRealtimeClient();
  
  try {
    await client.removeChannel(channel);
    
    // Remove from active channels map
    for (const [name, ch] of activeChannels.entries()) {
      if (ch === channel) {
        activeChannels.delete(name);
        console.log(`[Realtime] Unsubscribed from ${name}`);
        break;
      }
    }
  } catch (error) {
    console.error("[Realtime] Error unsubscribing:", error);
    throw error;
  }
}

/**
 * Unsubscribe from all active channels
 */
export async function unsubscribeAll(): Promise<void> {
  const client = getRealtimeClient();
  
  for (const [name, channel] of activeChannels.entries()) {
    try {
      await client.removeChannel(channel);
      console.log(`[Realtime] Unsubscribed from ${name}`);
    } catch (error) {
      console.error(`[Realtime] Error unsubscribing from ${name}:`, error);
    }
  }
  
  activeChannels.clear();
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): "connected" | "connecting" | "disconnected" | "error" {
  if (!browserClient) return "disconnected";
  
  // Check if any channels are active
  if (activeChannels.size === 0) return "disconnected";
  
  // Note: Supabase doesn't expose a direct connection status,
  // so we infer from channel activity
  return "connected";
}

// ============================================================================
// Realtime Manager Factory
// ============================================================================

/**
 * Create a realtime manager instance
 */
export function createRealtimeManager(): RealtimeManager {
  return {
    subscribe: subscribeToTable,
    unsubscribe: unsubscribeFromChannel,
    unsubscribeAll,
    getStatus: getConnectionStatus,
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  type RealtimeChannel,
  type RealtimePostgresChangesPayload,
};
