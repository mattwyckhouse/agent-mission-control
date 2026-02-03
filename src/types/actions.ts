/**
 * Agent Action Types
 * 
 * Defines types for agent control actions (start, stop, restart, message)
 * and their responses.
 * 
 * @module types/actions
 */

// ============================================================================
// Action Types
// ============================================================================

export type AgentActionType = "start" | "stop" | "restart" | "message" | "heartbeat";

export interface AgentAction {
  /** Type of action to perform */
  type: AgentActionType;
  /** Target agent ID */
  agentId: string;
  /** Optional message content (for message action) */
  message?: string;
  /** Optional action metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp of action request */
  requestedAt: string;
  /** User/system that requested the action */
  requestedBy: string;
}

// ============================================================================
// Action Results
// ============================================================================

export type ActionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ActionResult {
  /** Unique action ID */
  id: string;
  /** Original action request */
  action: AgentAction;
  /** Current status */
  status: ActionStatus;
  /** Result message */
  message: string;
  /** Detailed output (if any) */
  output?: string;
  /** Error details (if failed) */
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  /** Timestamps */
  startedAt?: string;
  completedAt?: string;
  /** Duration in milliseconds */
  durationMs?: number;
}

// ============================================================================
// Action Request/Response Types
// ============================================================================

export interface ActionRequest {
  type: AgentActionType;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionResponse {
  success: boolean;
  actionId: string;
  result: ActionResult;
}

export interface BulkActionRequest {
  agentIds: string[];
  action: Omit<ActionRequest, "agentId">;
}

export interface BulkActionResponse {
  success: boolean;
  results: Record<string, ActionResult>;
  summary: {
    total: number;
    completed: number;
    failed: number;
  };
}

// ============================================================================
// Action History
// ============================================================================

export interface ActionHistoryItem {
  id: string;
  agentId: string;
  type: AgentActionType;
  status: ActionStatus;
  message: string;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ActionHistoryFilter {
  agentId?: string;
  type?: AgentActionType;
  status?: ActionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidActionType(type: string): type is AgentActionType {
  return ["start", "stop", "restart", "message", "heartbeat"].includes(type);
}

export function isCompletedAction(result: ActionResult): boolean {
  return result.status === "completed" || result.status === "failed" || result.status === "cancelled";
}

export function isSuccessfulAction(result: ActionResult): boolean {
  return result.status === "completed";
}

// ============================================================================
// Action Descriptions
// ============================================================================

export const ACTION_DESCRIPTIONS: Record<AgentActionType, string> = {
  start: "Start the agent session",
  stop: "Stop the agent session",
  restart: "Restart the agent session",
  message: "Send a message to the agent",
  heartbeat: "Trigger a heartbeat check",
};

export const ACTION_ICONS: Record<AgentActionType, string> = {
  start: "Play",
  stop: "Square",
  restart: "RotateCcw",
  message: "MessageSquare",
  heartbeat: "Heart",
};
