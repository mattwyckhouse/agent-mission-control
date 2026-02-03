/**
 * Tests for OpenClaw Sync Cron Job
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseTasksMd,
  parsePendingTasksMd,
  parseAgentStatusTable,
  parseAgentReports,
  createSyncData,
  formatForSupabase,
  getDefaultConfig,
  runSync,
  KNOWN_AGENTS,
} from "./cron";

// ============================================================================
// Test Data
// ============================================================================

const SAMPLE_TASKS_MD = `# TASKS.md

## 🔴 URGENT — Needs Immediate Attention

- [ ] **Critical bug in production** — @Forge
  - Added: 2026-02-03T10:00:00Z
  - Context: Users seeing 500 errors

## 🟡 ACTION — Needs Human Decision

- [ ] **Approve new feature spec** — @Klaus
  - Added: 2026-02-02T15:00:00Z

## 📋 IN PROGRESS — Agents Working

- [ ] **Building Mission Control** — @Forge
  - Added: 2026-02-01T08:00:00Z

## ✅ COMPLETED — Done Items

- [x] **Set up Supabase** — @Forge
  - Added: 2026-01-30T12:00:00Z

---

## 📊 SQUAD STATUS

| Agent | Domain | Last Heartbeat | Status |
|-------|--------|----------------|--------|
| Klaus | Squad Lead | 2026-02-03 03:00 | 🟢 |
| Forge | Code & PRs | 2026-02-03 03:10 | 🟡 |
| Iris | Email | 2026-02-02 23:00 | 🔴 |
| Atlas | Calendar | Never | ⚪ |

---

## 📝 AGENT REPORTS

#### Forge
*Last check: 2026-02-03T03:10:00Z*
Building Phase 2 of Mission Control.
Step 8/48 complete.

#### Klaus
*Last check: 2026-02-03T03:00:00Z*
Monitoring squad activity.
All systems nominal.
`;

const SAMPLE_PENDING_TASKS = `# PENDING_TASKS.md

## 🔄 In Progress

### Deploy new API version
**Owner:** Forge
**Started:** 2026-02-03T01:00:00Z

Building and deploying the new sync API.

### Research competitor features
**Owner:** Oracle
**Started:** 2026-02-02T20:00:00Z

## ✅ Completed Today

### Fix login bug — v1.2.3
**Owner:** Forge
**Completed:** 2026-02-03T02:30:00Z

Users can now log in without issues.

## 📋 Archive
`;

// ============================================================================
// parseTasksMd Tests
// ============================================================================

describe("parseTasksMd", () => {
  it("should parse all four sections", () => {
    const result = parseTasksMd(SAMPLE_TASKS_MD);
    
    expect(result.urgent).toHaveLength(1);
    expect(result.action).toHaveLength(1);
    expect(result.inProgress).toHaveLength(1);
    expect(result.completed).toHaveLength(1);
  });

  it("should extract task content correctly", () => {
    const result = parseTasksMd(SAMPLE_TASKS_MD);
    
    expect(result.urgent[0]).toContain("Critical bug in production");
    expect(result.urgent[0]).toContain("@Forge");
  });

  it("should handle empty content", () => {
    const result = parseTasksMd("");
    
    expect(result.urgent).toHaveLength(0);
    expect(result.action).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
  });

  it("should handle content with only some sections", () => {
    const partialContent = `
## 🔴 URGENT — Needs Immediate Attention

- [ ] **Only urgent task**
`;
    const result = parseTasksMd(partialContent);
    
    expect(result.urgent).toHaveLength(1);
    expect(result.action).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
  });

  it("should preserve multi-line task context", () => {
    const result = parseTasksMd(SAMPLE_TASKS_MD);
    
    expect(result.urgent[0]).toContain("Added:");
    expect(result.urgent[0]).toContain("Context:");
  });
});

// ============================================================================
// parsePendingTasksMd Tests
// ============================================================================

describe("parsePendingTasksMd", () => {
  it("should parse in progress tasks", () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS);
    
    const inProgress = result.filter(t => t.status === "in_progress");
    expect(inProgress).toHaveLength(2);
  });

  it("should parse completed tasks", () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS);
    
    const completed = result.filter(t => t.status === "done");
    expect(completed).toHaveLength(1);
    expect(completed[0].title).toBe("Fix login bug");
  });

  it("should extract owner as assignedAgentId", () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS);
    
    const forgeTask = result.find(t => t.title === "Deploy new API version");
    expect(forgeTask?.assignedAgentId).toBe("forge");
  });

  it("should handle empty content", () => {
    const result = parsePendingTasksMd("");
    expect(result).toHaveLength(0);
  });

  it("should tag tasks with async-task", () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS);
    
    for (const task of result) {
      expect(task.tags).toContain("async-task");
    }
  });

  it("should set context source to PENDING_TASKS.md", () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS);
    
    for (const task of result) {
      expect(task.context.source).toBe("PENDING_TASKS.md");
    }
  });
});

// ============================================================================
// parseAgentStatusTable Tests
// ============================================================================

describe("parseAgentStatusTable", () => {
  it("should parse agent statuses from table", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.size).toBe(4);
  });

  it("should map 🟢 to online status", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.get("klaus")?.status).toBe("online");
  });

  it("should map 🟡 to busy status", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.get("forge")?.status).toBe("busy");
  });

  it("should map 🔴 to error status", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.get("iris")?.status).toBe("error");
  });

  it("should map unknown emoji to offline status", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.get("atlas")?.status).toBe("offline");
  });

  it("should extract last heartbeat timestamps", () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD);
    
    expect(result.get("klaus")?.lastHeartbeat).toBe("2026-02-03 03:00");
    expect(result.get("atlas")?.lastHeartbeat).toBe("Never");
  });

  it("should handle content without status table", () => {
    const result = parseAgentStatusTable("# No table here");
    expect(result.size).toBe(0);
  });
});

// ============================================================================
// parseAgentReports Tests
// ============================================================================

describe("parseAgentReports", () => {
  it("should parse agent reports into activities", () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD);
    
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("should extract agent name correctly", () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD);
    
    const forgeReport = result.find(a => a.agentId === "forge");
    expect(forgeReport).toBeDefined();
    expect(forgeReport?.title).toBe("Forge heartbeat report");
  });

  it("should extract timestamp from report", () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD);
    
    const forgeReport = result.find(a => a.agentId === "forge");
    expect(forgeReport?.createdAt).toBe("2026-02-03T03:10:00Z");
  });

  it("should truncate long descriptions to 500 chars", () => {
    const longContent = `
## 📝 AGENT REPORTS

#### TestAgent
*Last check: 2026-02-03T00:00:00Z*
${"A".repeat(1000)}
`;
    const result = parseAgentReports(longContent);
    
    expect(result[0]?.description?.length).toBeLessThanOrEqual(500);
  });

  it("should handle content without reports section", () => {
    const result = parseAgentReports("# No reports here");
    expect(result).toHaveLength(0);
  });

  it("should set activity type to agent_status_change", () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD);
    
    for (const activity of result) {
      expect(activity.type).toBe("agent_status_change");
    }
  });
});

// ============================================================================
// createSyncData Tests
// ============================================================================

describe("createSyncData", () => {
  it("should create sync data with all known agents", () => {
    const agentStatuses = new Map<string, { lastHeartbeat: string; status: "online" | "busy" | "offline" | "error" }>();
    agentStatuses.set("klaus", { lastHeartbeat: "2026-02-03 03:00", status: "online" });
    
    const result = createSyncData(SAMPLE_TASKS_MD, SAMPLE_PENDING_TASKS, agentStatuses);
    
    expect(result.agents).toHaveLength(KNOWN_AGENTS.length);
  });

  it("should combine tasks from TASKS.md and PENDING_TASKS.md", () => {
    const result = createSyncData(SAMPLE_TASKS_MD, SAMPLE_PENDING_TASKS, new Map());
    
    // 4 from TASKS.md + 3 from PENDING_TASKS.md
    expect(result.tasks.length).toBeGreaterThanOrEqual(4);
  });

  it("should include synced_at timestamp", () => {
    const before = new Date().toISOString();
    const result = createSyncData("", "", new Map());
    const after = new Date().toISOString();
    
    expect(result.syncedAt >= before).toBe(true);
    expect(result.syncedAt <= after).toBe(true);
  });

  it("should set agent status from status map", () => {
    const agentStatuses = new Map<string, { lastHeartbeat: string; status: "online" | "busy" | "offline" | "error" }>();
    agentStatuses.set("forge", { lastHeartbeat: "2026-02-03 03:10", status: "busy" });
    
    const result = createSyncData("", "", agentStatuses);
    
    const forge = result.agents.find(a => a.id === "forge");
    expect(forge?.status).toBe("busy");
    expect(forge?.lastHeartbeat).toBe("2026-02-03 03:10");
  });

  it("should default agent status to offline when not in map", () => {
    const result = createSyncData("", "", new Map());
    
    const forge = result.agents.find(a => a.id === "forge");
    expect(forge?.status).toBe("offline");
    expect(forge?.lastHeartbeat).toBeNull();
  });

  it("should include activities from agent reports", () => {
    const result = createSyncData(SAMPLE_TASKS_MD, "", new Map());
    
    expect(result.activities.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// formatForSupabase Tests
// ============================================================================

describe("formatForSupabase", () => {
  it("should convert agent fields to snake_case", () => {
    const syncData = createSyncData("", "", new Map());
    const result = formatForSupabase(syncData);
    
    expect(result.agents[0]).toHaveProperty("display_name");
    expect(result.agents[0]).toHaveProperty("soul_path");
    expect(result.agents[0]).toHaveProperty("session_key");
    expect(result.agents[0]).toHaveProperty("last_heartbeat");
  });

  it("should convert task fields to snake_case", () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, "", new Map());
    const result = formatForSupabase(syncData);
    
    if (result.tasks.length > 0) {
      expect(result.tasks[0]).toHaveProperty("assigned_agent_id");
      expect(result.tasks[0]).toHaveProperty("created_by");
      expect(result.tasks[0]).toHaveProperty("due_date");
    }
  });

  it("should convert activity fields to snake_case", () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, "", new Map());
    const result = formatForSupabase(syncData);
    
    if (result.activities.length > 0) {
      expect(result.activities[0]).toHaveProperty("activity_type");
      expect(result.activities[0]).toHaveProperty("agent_id");
      expect(result.activities[0]).toHaveProperty("task_id");
      expect(result.activities[0]).toHaveProperty("created_at");
    }
  });

  it("should set session_key format correctly", () => {
    const syncData = createSyncData("", "", new Map());
    const result = formatForSupabase(syncData);
    
    const forge = result.agents.find(a => a.id === "forge");
    expect(forge?.session_key).toBe("agent:forge:main");
  });

  it("should include synced_at at root level", () => {
    const syncData = createSyncData("", "", new Map());
    const result = formatForSupabase(syncData);
    
    expect(result).toHaveProperty("synced_at");
    expect(typeof result.synced_at).toBe("string");
  });

  it("should set completed_at only for done tasks", () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, "", new Map());
    const result = formatForSupabase(syncData);
    
    const completedTask = result.tasks.find(t => t.status === "done");
    const inProgressTask = result.tasks.find(t => t.status === "in_progress");
    
    if (completedTask) {
      expect(completedTask.completed_at).not.toBeNull();
    }
    if (inProgressTask) {
      expect(inProgressTask.completed_at).toBeNull();
    }
  });
});

// ============================================================================
// getDefaultConfig Tests
// ============================================================================

describe("getDefaultConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return default API URL when env not set", () => {
    delete process.env.MISSION_CONTROL_API_URL;
    const config = getDefaultConfig();
    
    expect(config.apiUrl).toBe("https://agent-mission-control.vercel.app");
  });

  it("should use MISSION_CONTROL_API_URL from env", () => {
    process.env.MISSION_CONTROL_API_URL = "http://localhost:3000";
    const config = getDefaultConfig();
    
    expect(config.apiUrl).toBe("http://localhost:3000");
  });

  it("should use OPENCLAW_WORKSPACE from env", () => {
    process.env.OPENCLAW_WORKSPACE = "/custom/workspace";
    const config = getDefaultConfig();
    
    expect(config.workspacePath).toBe("/custom/workspace");
  });

  it("should set verbose from SYNC_VERBOSE env", () => {
    process.env.SYNC_VERBOSE = "true";
    const config = getDefaultConfig();
    
    expect(config.verbose).toBe(true);
  });

  it("should set timeout to 30 seconds by default", () => {
    const config = getDefaultConfig();
    
    expect(config.timeoutMs).toBe(30000);
  });
});

// ============================================================================
// runSync Tests (with mocked fetch)
// ============================================================================

describe("runSync", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("should return success result when API returns 200", async () => {
    vi.useRealTimers(); // Use real timers for this test
    
    const mockResponse: { success: boolean; synced_at: string; counts: { agents_upserted: number; tasks_upserted: number; activities_inserted: number }; errors: string[] } = {
      success: true,
      synced_at: "2026-02-03T03:00:00Z",
      counts: { agents_upserted: 13, tasks_upserted: 5, activities_inserted: 2 },
      errors: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await runSync({
      workspacePath: "/nonexistent/path",
      apiUrl: "http://test.local",
      verbose: false,
    });

    expect(result.success).toBe(true);
    expect(result.counts.agents_upserted).toBe(13);
  });

  it("should return error result when API returns non-200", async () => {
    vi.useRealTimers();
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const result = await runSync({
      workspacePath: "/nonexistent/path",
      apiUrl: "http://test.local",
      verbose: false,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("500");
  });

  it("should include auth header when apiKey is provided", async () => {
    vi.useRealTimers();
    
    let capturedHeaders: Headers | Record<string, string> | undefined;
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      capturedHeaders = options?.headers;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, synced_at: "", counts: {}, errors: [] }),
      });
    });

    await runSync({
      workspacePath: "/nonexistent/path",
      apiUrl: "http://test.local",
      apiKey: "test-api-key",
      verbose: false,
    });

    expect(capturedHeaders).toBeDefined();
    expect((capturedHeaders as Record<string, string>)["Authorization"]).toBe("Bearer test-api-key");
  });

  it("should send correct payload structure", async () => {
    vi.useRealTimers();
    
    let capturedBody: string | undefined;
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, synced_at: "", counts: {}, errors: [] }),
      });
    });

    await runSync({
      workspacePath: "/nonexistent/path",
      apiUrl: "http://test.local",
      verbose: false,
    });

    expect(capturedBody).toBeDefined();
    const payload = JSON.parse(capturedBody!);
    expect(payload).toHaveProperty("agents");
    expect(payload).toHaveProperty("tasks");
    expect(payload).toHaveProperty("activities");
    expect(payload).toHaveProperty("synced_at");
  });
});

// ============================================================================
// KNOWN_AGENTS Tests
// ============================================================================

describe("KNOWN_AGENTS", () => {
  it("should have 13 agents defined", () => {
    expect(KNOWN_AGENTS).toHaveLength(13);
  });

  it("should include Klaus as squad lead", () => {
    const klaus = KNOWN_AGENTS.find(a => a.id === "klaus");
    expect(klaus).toBeDefined();
    expect(klaus?.domain).toBe("Squad Lead");
  });

  it("should include Forge for code", () => {
    const forge = KNOWN_AGENTS.find(a => a.id === "forge");
    expect(forge).toBeDefined();
    expect(forge?.domain).toBe("Code & PRs");
  });

  it("should have unique ids", () => {
    const ids = KNOWN_AGENTS.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have emojis for all agents", () => {
    for (const agent of KNOWN_AGENTS) {
      expect(agent.emoji).toBeDefined();
      expect(agent.emoji.length).toBeGreaterThan(0);
    }
  });
});
