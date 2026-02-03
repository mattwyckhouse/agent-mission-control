import { describe, it, expect } from "vitest";
import {
  isValidActionType,
  isCompletedAction,
  isSuccessfulAction,
  ACTION_DESCRIPTIONS,
  ACTION_ICONS,
  type ActionResult,
  type AgentAction,
} from "./actions";

describe("Action Type Guards", () => {
  describe("isValidActionType", () => {
    it("returns true for valid action types", () => {
      expect(isValidActionType("start")).toBe(true);
      expect(isValidActionType("stop")).toBe(true);
      expect(isValidActionType("restart")).toBe(true);
      expect(isValidActionType("message")).toBe(true);
      expect(isValidActionType("heartbeat")).toBe(true);
    });

    it("returns false for invalid action types", () => {
      expect(isValidActionType("invalid")).toBe(false);
      expect(isValidActionType("")).toBe(false);
      expect(isValidActionType("START")).toBe(false); // case sensitive
      expect(isValidActionType("pause")).toBe(false);
    });
  });

  describe("isCompletedAction", () => {
    const baseAction: AgentAction = {
      type: "start",
      agentId: "test-agent",
      requestedAt: new Date().toISOString(),
      requestedBy: "user",
    };

    it("returns true for completed, failed, or cancelled", () => {
      expect(isCompletedAction({
        id: "1",
        action: baseAction,
        status: "completed",
        message: "Done",
      })).toBe(true);

      expect(isCompletedAction({
        id: "2",
        action: baseAction,
        status: "failed",
        message: "Error",
      })).toBe(true);

      expect(isCompletedAction({
        id: "3",
        action: baseAction,
        status: "cancelled",
        message: "Cancelled",
      })).toBe(true);
    });

    it("returns false for pending or running", () => {
      expect(isCompletedAction({
        id: "1",
        action: baseAction,
        status: "pending",
        message: "Waiting",
      })).toBe(false);

      expect(isCompletedAction({
        id: "2",
        action: baseAction,
        status: "running",
        message: "In progress",
      })).toBe(false);
    });
  });

  describe("isSuccessfulAction", () => {
    const baseAction: AgentAction = {
      type: "start",
      agentId: "test-agent",
      requestedAt: new Date().toISOString(),
      requestedBy: "user",
    };

    it("returns true only for completed status", () => {
      expect(isSuccessfulAction({
        id: "1",
        action: baseAction,
        status: "completed",
        message: "Success",
      })).toBe(true);
    });

    it("returns false for non-completed statuses", () => {
      expect(isSuccessfulAction({
        id: "1",
        action: baseAction,
        status: "failed",
        message: "Error",
      })).toBe(false);

      expect(isSuccessfulAction({
        id: "2",
        action: baseAction,
        status: "running",
        message: "In progress",
      })).toBe(false);
    });
  });
});

describe("Action Constants", () => {
  it("ACTION_DESCRIPTIONS has entries for all action types", () => {
    expect(ACTION_DESCRIPTIONS.start).toBeDefined();
    expect(ACTION_DESCRIPTIONS.stop).toBeDefined();
    expect(ACTION_DESCRIPTIONS.restart).toBeDefined();
    expect(ACTION_DESCRIPTIONS.message).toBeDefined();
    expect(ACTION_DESCRIPTIONS.heartbeat).toBeDefined();
  });

  it("ACTION_ICONS has entries for all action types", () => {
    expect(ACTION_ICONS.start).toBe("Play");
    expect(ACTION_ICONS.stop).toBe("Square");
    expect(ACTION_ICONS.restart).toBe("RotateCcw");
    expect(ACTION_ICONS.message).toBe("MessageSquare");
    expect(ACTION_ICONS.heartbeat).toBe("Heart");
  });
});

describe("Action Types", () => {
  it("ActionResult can represent a successful action", () => {
    const result: ActionResult = {
      id: "action-123",
      action: {
        type: "start",
        agentId: "forge",
        requestedAt: "2026-02-03T04:00:00Z",
        requestedBy: "matt",
      },
      status: "completed",
      message: "Agent started successfully",
      startedAt: "2026-02-03T04:00:00Z",
      completedAt: "2026-02-03T04:00:01Z",
      durationMs: 1000,
    };

    expect(result.id).toBe("action-123");
    expect(result.status).toBe("completed");
    expect(isSuccessfulAction(result)).toBe(true);
  });

  it("ActionResult can represent a failed action", () => {
    const result: ActionResult = {
      id: "action-456",
      action: {
        type: "stop",
        agentId: "iris",
        requestedAt: "2026-02-03T04:00:00Z",
        requestedBy: "system",
      },
      status: "failed",
      message: "Failed to stop agent",
      error: {
        code: "AGENT_NOT_RUNNING",
        message: "Agent is not currently running",
      },
      startedAt: "2026-02-03T04:00:00Z",
      completedAt: "2026-02-03T04:00:00Z",
      durationMs: 50,
    };

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("AGENT_NOT_RUNNING");
    expect(isSuccessfulAction(result)).toBe(false);
    expect(isCompletedAction(result)).toBe(true);
  });
});
