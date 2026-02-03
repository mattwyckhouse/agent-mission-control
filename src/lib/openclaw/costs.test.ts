/**
 * Tests for OpenClaw Cost Data Aggregator
 */

import { describe, it, expect } from "vitest";
import {
  calculateCost,
  extractAgentId,
  extractDate,
  aggregateByAgentAndDate,
  aggregateByDate,
  calculateCostSummary,
  parseUsageLogLine,
  parseUsageLog,
  parseUsageJson,
  generateMockUsageData,
  MODEL_PRICING,
  type OpenClawUsageEntry,
} from "./costs";

// ============================================================================
// calculateCost Tests
// ============================================================================

describe("calculateCost", () => {
  it("calculates cost correctly for known model", () => {
    // claude-3.5-sonnet: $3/1M input, $15/1M output
    const cost = calculateCost(1000000, 1000000, "claude-3.5-sonnet");
    expect(cost).toBe(18); // $3 + $15
  });

  it("handles zero tokens", () => {
    const cost = calculateCost(0, 0, "claude-3.5-sonnet");
    expect(cost).toBe(0);
  });

  it("uses default pricing for unknown model", () => {
    const cost = calculateCost(1000000, 1000000, "unknown-model");
    // Default: $3/1M input, $15/1M output
    expect(cost).toBe(18);
  });

  it("calculates cost for small token counts", () => {
    // 1000 input tokens, 500 output tokens on claude-3.5-sonnet
    const cost = calculateCost(1000, 500, "claude-3.5-sonnet");
    // (1000/1M * 3) + (500/1M * 15) = 0.003 + 0.0075 = 0.0105
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it("handles anthropic prefixed model names", () => {
    const cost = calculateCost(1000000, 1000000, "anthropic/claude-opus-4-5");
    // Opus: $15/1M input, $75/1M output
    expect(cost).toBe(90);
  });
});

// ============================================================================
// extractAgentId Tests
// ============================================================================

describe("extractAgentId", () => {
  it("extracts agent ID from main session key", () => {
    expect(extractAgentId("agent:klaus:main")).toBe("klaus");
    expect(extractAgentId("agent:forge:main")).toBe("forge");
  });

  it("extracts agent ID from isolated session key", () => {
    expect(extractAgentId("agent:iris:isolated:abc123")).toBe("iris");
  });

  it("returns null for invalid session key", () => {
    expect(extractAgentId("invalid-key")).toBeNull();
    expect(extractAgentId("")).toBeNull();
  });
});

// ============================================================================
// extractDate Tests
// ============================================================================

describe("extractDate", () => {
  it("extracts date from ISO timestamp", () => {
    expect(extractDate("2026-02-03T10:30:00Z")).toBe("2026-02-03");
    expect(extractDate("2026-01-15T00:00:00.000Z")).toBe("2026-01-15");
  });
});

// ============================================================================
// aggregateByAgentAndDate Tests
// ============================================================================

describe("aggregateByAgentAndDate", () => {
  it("aggregates multiple entries for same agent and date", () => {
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: "2026-02-03T10:00:00Z" },
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 2000, outputTokens: 1000, timestamp: "2026-02-03T15:00:00Z" },
    ];

    const result = aggregateByAgentAndDate(entries);
    
    expect(result.length).toBe(1);
    expect(result[0].agentId).toBe("klaus");
    expect(result[0].date).toBe("2026-02-03");
    expect(result[0].runs).toBe(2);
    expect(result[0].inputTokens).toBe(3000);
    expect(result[0].outputTokens).toBe(1500);
    expect(result[0].totalTokens).toBe(4500);
  });

  it("separates entries for different dates", () => {
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: "2026-02-03T10:00:00Z" },
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 2000, outputTokens: 1000, timestamp: "2026-02-04T10:00:00Z" },
    ];

    const result = aggregateByAgentAndDate(entries);
    
    expect(result.length).toBe(2);
    expect(result.find(r => r.date === "2026-02-03")?.inputTokens).toBe(1000);
    expect(result.find(r => r.date === "2026-02-04")?.inputTokens).toBe(2000);
  });

  it("separates entries for different agents", () => {
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: "2026-02-03T10:00:00Z" },
      { sessionKey: "agent:forge:main", agentId: "forge", model: "claude-3.5-sonnet", inputTokens: 3000, outputTokens: 1500, timestamp: "2026-02-03T10:00:00Z" },
    ];

    const result = aggregateByAgentAndDate(entries);
    
    expect(result.length).toBe(2);
    expect(result.find(r => r.agentId === "klaus")?.inputTokens).toBe(1000);
    expect(result.find(r => r.agentId === "forge")?.inputTokens).toBe(3000);
  });

  it("handles empty input", () => {
    expect(aggregateByAgentAndDate([])).toEqual([]);
  });
});

// ============================================================================
// aggregateByDate Tests
// ============================================================================

describe("aggregateByDate", () => {
  it("aggregates costs by date across agents", () => {
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000000, outputTokens: 0, timestamp: "2026-02-03T10:00:00Z" },
      { sessionKey: "agent:forge:main", agentId: "forge", model: "claude-3.5-sonnet", inputTokens: 1000000, outputTokens: 0, timestamp: "2026-02-03T15:00:00Z" },
    ];

    const result = aggregateByDate(entries);
    
    expect(result.length).toBe(1);
    expect(result[0].date).toBe("2026-02-03");
    expect(result[0].totalCost).toBe(6); // $3 + $3
    expect(result[0].byAgent["klaus"]).toBe(3);
    expect(result[0].byAgent["forge"]).toBe(3);
  });

  it("sorts results by date", () => {
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: "2026-02-05T10:00:00Z" },
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 2000, outputTokens: 1000, timestamp: "2026-02-03T10:00:00Z" },
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1500, outputTokens: 750, timestamp: "2026-02-04T10:00:00Z" },
    ];

    const result = aggregateByDate(entries);
    
    expect(result.map(r => r.date)).toEqual(["2026-02-03", "2026-02-04", "2026-02-05"]);
  });
});

// ============================================================================
// calculateCostSummary Tests
// ============================================================================

describe("calculateCostSummary", () => {
  it("calculates summary for given period", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: now.toISOString() },
      { sessionKey: "agent:forge:main", agentId: "forge", model: "claude-3.5-sonnet", inputTokens: 2000, outputTokens: 1000, timestamp: yesterday.toISOString() },
    ];

    const summary = calculateCostSummary(entries, "week");
    
    expect(summary.period).toBe("week");
    expect(summary.totalRuns).toBe(2);
    expect(summary.byAgent.length).toBe(2);
    expect(summary.daily.length).toBeGreaterThan(0);
  });

  it("calculates cost change percentage", () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    const entries: OpenClawUsageEntry[] = [
      // Current period: $3
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000000, outputTokens: 0, timestamp: now.toISOString() },
      // Previous period: $6
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 2000000, outputTokens: 0, timestamp: lastWeek.toISOString() },
    ];

    const summary = calculateCostSummary(entries, "week");
    
    // Cost dropped from $6 to $3 = -50%
    expect(summary.costChange).toBeCloseTo(-50, 0);
  });

  it("handles zero in previous period", () => {
    const now = new Date();
    
    const entries: OpenClawUsageEntry[] = [
      { sessionKey: "agent:klaus:main", agentId: "klaus", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: now.toISOString() },
    ];

    const summary = calculateCostSummary(entries, "week");
    
    expect(summary.costChange).toBe(0); // No division by zero error
  });
});

// ============================================================================
// parseUsageLogLine Tests
// ============================================================================

describe("parseUsageLogLine", () => {
  it("parses valid log line", () => {
    const line = "2026-02-03T10:00:00Z|agent:klaus:main|claude-3.5-sonnet|1000|500";
    const entry = parseUsageLogLine(line);
    
    expect(entry).not.toBeNull();
    expect(entry?.sessionKey).toBe("agent:klaus:main");
    expect(entry?.model).toBe("claude-3.5-sonnet");
    expect(entry?.inputTokens).toBe(1000);
    expect(entry?.outputTokens).toBe(500);
    expect(entry?.timestamp).toBe("2026-02-03T10:00:00Z");
  });

  it("returns null for invalid line", () => {
    expect(parseUsageLogLine("invalid")).toBeNull();
    expect(parseUsageLogLine("a|b|c")).toBeNull();
    expect(parseUsageLogLine("")).toBeNull();
  });

  it("returns null for non-numeric token counts", () => {
    expect(parseUsageLogLine("2026-02-03|session|model|abc|500")).toBeNull();
  });
});

// ============================================================================
// parseUsageLog Tests
// ============================================================================

describe("parseUsageLog", () => {
  it("parses multiple lines", () => {
    const content = `
# Usage Log
2026-02-03T10:00:00Z|agent:klaus:main|claude-3.5-sonnet|1000|500
2026-02-03T11:00:00Z|agent:forge:main|claude-3.5-sonnet|2000|1000
    `;

    const entries = parseUsageLog(content);
    
    expect(entries.length).toBe(2);
    expect(entries[0].agentId).toBe("klaus");
    expect(entries[1].agentId).toBe("forge");
  });

  it("skips invalid lines and comments", () => {
    const content = `
# This is a comment
2026-02-03T10:00:00Z|agent:klaus:main|claude-3.5-sonnet|1000|500
invalid line
    `;

    const entries = parseUsageLog(content);
    
    expect(entries.length).toBe(1);
  });
});

// ============================================================================
// parseUsageJson Tests
// ============================================================================

describe("parseUsageJson", () => {
  it("parses JSON array of usage data", () => {
    const data = [
      { sessionKey: "agent:klaus:main", model: "claude-3.5-sonnet", inputTokens: 1000, outputTokens: 500, timestamp: "2026-02-03T10:00:00Z" },
      { session_key: "agent:forge:main", model: "claude-3.5-sonnet", input_tokens: 2000, output_tokens: 1000, created_at: "2026-02-03T11:00:00Z" },
    ];

    const entries = parseUsageJson(data);
    
    expect(entries.length).toBe(2);
    expect(entries[0].sessionKey).toBe("agent:klaus:main");
    expect(entries[1].sessionKey).toBe("agent:forge:main");
  });

  it("handles snake_case field names", () => {
    const data = [
      { session_key: "agent:iris:main", agent_id: "iris", model: "gpt-4o", input_tokens: 500, output_tokens: 250, created_at: "2026-02-03T12:00:00Z" },
    ];

    const entries = parseUsageJson(data);
    
    expect(entries[0].agentId).toBe("iris");
    expect(entries[0].inputTokens).toBe(500);
    expect(entries[0].outputTokens).toBe(250);
  });

  it("returns empty array for non-array input", () => {
    expect(parseUsageJson(null as unknown as unknown[])).toEqual([]);
    expect(parseUsageJson("string" as unknown as unknown[])).toEqual([]);
  });
});

// ============================================================================
// generateMockUsageData Tests
// ============================================================================

describe("generateMockUsageData", () => {
  it("generates data for specified days and agents", () => {
    const data = generateMockUsageData(3, ["klaus", "forge"]);
    
    // Should have at least some entries
    expect(data.length).toBeGreaterThan(0);
    
    // All entries should be for klaus or forge
    expect(data.every(e => ["klaus", "forge"].includes(e.agentId))).toBe(true);
  });

  it("generates entries with valid structure", () => {
    const data = generateMockUsageData(1, ["klaus"]);
    
    for (const entry of data) {
      expect(entry.sessionKey).toMatch(/^agent:klaus:/);
      expect(entry.agentId).toBe("klaus");
      expect(entry.model).toBe("claude-3.5-sonnet");
      expect(entry.inputTokens).toBeGreaterThanOrEqual(500);
      expect(entry.outputTokens).toBeGreaterThanOrEqual(200);
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });
});

// ============================================================================
// MODEL_PRICING Tests
// ============================================================================

describe("MODEL_PRICING", () => {
  it("has pricing for common models", () => {
    expect(MODEL_PRICING["claude-3.5-sonnet"]).toBeDefined();
    expect(MODEL_PRICING["gpt-4o"]).toBeDefined();
    expect(MODEL_PRICING["default"]).toBeDefined();
  });

  it("has valid pricing structure", () => {
    for (const [, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.input).toBeGreaterThanOrEqual(0);
      expect(pricing.output).toBeGreaterThanOrEqual(0);
    }
  });
});
