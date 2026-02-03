import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  getValidNextStatuses,
  getTransitionEffects,
  canDropInColumn,
  calculateOptimisticUpdate,
  STATUS_CONFIG,
  KANBAN_COLUMNS,
  ALL_COLUMNS,
  type TaskStatus,
} from "./transitions";

describe("Task Status Transitions", () => {
  describe("isValidTransition", () => {
    it("allows same status (no change)", () => {
      expect(isValidTransition("inbox", "inbox")).toBe(true);
      expect(isValidTransition("done", "done")).toBe(true);
    });

    it("allows inbox → assigned", () => {
      expect(isValidTransition("inbox", "assigned")).toBe(true);
    });

    it("allows assigned → in_progress", () => {
      expect(isValidTransition("assigned", "in_progress")).toBe(true);
    });

    it("allows in_progress → review", () => {
      expect(isValidTransition("in_progress", "review")).toBe(true);
    });

    it("allows review → done", () => {
      expect(isValidTransition("review", "done")).toBe(true);
    });

    it("allows done → in_progress (reopen)", () => {
      expect(isValidTransition("done", "in_progress")).toBe(true);
    });

    it("disallows skipping steps (inbox → done)", () => {
      expect(isValidTransition("inbox", "done")).toBe(false);
    });

    it("disallows going backwards past assigned", () => {
      expect(isValidTransition("review", "inbox")).toBe(false);
    });

    it("allows cancellation from any active status", () => {
      expect(isValidTransition("inbox", "cancelled")).toBe(true);
      expect(isValidTransition("assigned", "cancelled")).toBe(true);
      expect(isValidTransition("in_progress", "cancelled")).toBe(true);
      expect(isValidTransition("review", "cancelled")).toBe(true);
    });

    it("allows restoring cancelled to inbox", () => {
      expect(isValidTransition("cancelled", "inbox")).toBe(true);
    });
  });

  describe("getValidNextStatuses", () => {
    it("returns valid next statuses for inbox", () => {
      const next = getValidNextStatuses("inbox");
      expect(next).toContain("assigned");
      expect(next).toContain("cancelled");
      expect(next).not.toContain("done");
    });

    it("returns valid next statuses for in_progress", () => {
      const next = getValidNextStatuses("in_progress");
      expect(next).toContain("review");
      expect(next).toContain("done");
      expect(next).toContain("assigned");
    });

    it("returns valid next statuses for done", () => {
      const next = getValidNextStatuses("done");
      expect(next).toContain("in_progress"); // Can reopen
      expect(next.length).toBe(1);
    });
  });

  describe("getTransitionEffects", () => {
    it("sets startedAt when moving to in_progress", () => {
      const effects = getTransitionEffects("assigned", "in_progress");
      expect(effects.setStartedAt).toBe(true);
    });

    it("sets completedAt when moving to done", () => {
      const effects = getTransitionEffects("review", "done");
      expect(effects.setCompletedAt).toBe(true);
    });

    it("clears completedAt when reopening from done", () => {
      const effects = getTransitionEffects("done", "in_progress");
      expect(effects.clearCompletedAt).toBe(true);
    });

    it("returns empty effects for no-op transitions", () => {
      const effects = getTransitionEffects("inbox", "assigned");
      expect(effects.setStartedAt).toBeUndefined();
      expect(effects.setCompletedAt).toBeUndefined();
    });
  });

  describe("canDropInColumn", () => {
    it("allows valid drops", () => {
      expect(canDropInColumn("inbox", "assigned")).toBe(true);
      expect(canDropInColumn("assigned", "in_progress")).toBe(true);
    });

    it("disallows invalid drops", () => {
      expect(canDropInColumn("inbox", "done")).toBe(false);
      expect(canDropInColumn("done", "inbox")).toBe(false);
    });

    it("allows dropping in same column (reorder)", () => {
      expect(canDropInColumn("inbox", "inbox")).toBe(true);
    });
  });

  describe("calculateOptimisticUpdate", () => {
    it("moves task between columns", () => {
      const tasks = {
        inbox: [{ id: "task-1" }, { id: "task-2" }],
        assigned: [{ id: "task-3" }],
        in_progress: [],
        review: [],
        done: [],
        cancelled: [],
      };

      const result = calculateOptimisticUpdate(tasks, {
        taskId: "task-1",
        sourceStatus: "inbox",
        targetStatus: "assigned",
        targetIndex: 0,
      });

      expect(result.inbox).toHaveLength(1);
      expect(result.inbox[0].id).toBe("task-2");
      expect(result.assigned).toHaveLength(2);
      expect(result.assigned[0].id).toBe("task-1");
    });

    it("reorders within same column", () => {
      const tasks = {
        inbox: [{ id: "task-1" }, { id: "task-2" }, { id: "task-3" }],
        assigned: [],
        in_progress: [],
        review: [],
        done: [],
        cancelled: [],
      };

      const result = calculateOptimisticUpdate(tasks, {
        taskId: "task-1",
        sourceStatus: "inbox",
        targetStatus: "inbox",
        targetIndex: 2,
      });

      expect(result.inbox).toHaveLength(3);
      expect(result.inbox[0].id).toBe("task-2");
      expect(result.inbox[1].id).toBe("task-3");
      expect(result.inbox[2].id).toBe("task-1");
    });
  });

  describe("STATUS_CONFIG", () => {
    it("has config for all statuses", () => {
      const statuses: TaskStatus[] = ["inbox", "assigned", "in_progress", "review", "done", "cancelled"];
      
      for (const status of statuses) {
        expect(STATUS_CONFIG[status]).toBeDefined();
        expect(STATUS_CONFIG[status].label).toBeDefined();
        expect(STATUS_CONFIG[status].color).toBeDefined();
      }
    });
  });

  describe("Column Constants", () => {
    it("KANBAN_COLUMNS has main workflow columns", () => {
      expect(KANBAN_COLUMNS).toContain("inbox");
      expect(KANBAN_COLUMNS).toContain("in_progress");
      expect(KANBAN_COLUMNS).toContain("done");
      expect(KANBAN_COLUMNS).not.toContain("cancelled");
    });

    it("ALL_COLUMNS includes cancelled", () => {
      expect(ALL_COLUMNS).toContain("cancelled");
      expect(ALL_COLUMNS.length).toBeGreaterThan(KANBAN_COLUMNS.length);
    });
  });
});
