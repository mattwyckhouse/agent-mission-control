/**
 * OpenClaw Cost Data Aggregator
 * 
 * Aggregates usage stats from OpenClaw sessions by agent and by day.
 * Calculates token counts and estimated costs based on model pricing.
 */

import type { CostData, DailyCost, CostSummary } from "@/types";

// ============================================================================
// Types
// ============================================================================

/**
 * Raw usage data from OpenClaw session
 */
export interface OpenClawUsageEntry {
  sessionKey: string;
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: string;
}

/**
 * Model pricing per 1M tokens (input/output)
 */
export interface ModelPricing {
  input: number;  // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Known model pricing (as of Feb 2026)
 * Update these as pricing changes
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude
  "claude-3-opus": { input: 15.0, output: 75.0 },
  "claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
  "claude-opus-4-5": { input: 15.0, output: 75.0 },
  "anthropic/claude-opus-4-5": { input: 15.0, output: 75.0 },
  
  // OpenAI GPT
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  
  // Google Gemini
  "gemini-pro": { input: 0.5, output: 1.5 },
  "gemini-1.5-pro": { input: 3.5, output: 10.5 },
  
  // Default fallback
  "default": { input: 3.0, output: 15.0 },
};

// ============================================================================
// Cost Calculation
// ============================================================================

/**
 * Calculate cost from token counts
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = "default"
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Extract agent ID from session key
 * Format: agent:[agentId]:main or agent:[agentId]:isolated:[hash]
 */
export function extractAgentId(sessionKey: string): string | null {
  const match = sessionKey.match(/^agent:(\w+):/);
  return match ? match[1] : null;
}

/**
 * Extract date string from ISO timestamp
 */
export function extractDate(timestamp: string): string {
  return timestamp.slice(0, 10); // YYYY-MM-DD
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate usage entries by agent and date
 */
export function aggregateByAgentAndDate(
  entries: OpenClawUsageEntry[]
): CostData[] {
  const aggregated = new Map<string, CostData>();

  for (const entry of entries) {
    const agentId = extractAgentId(entry.sessionKey) || entry.agentId || "unknown";
    const date = extractDate(entry.timestamp);
    const key = `${agentId}-${date}`;

    const existing = aggregated.get(key);
    if (existing) {
      existing.runs += 1;
      existing.inputTokens += entry.inputTokens;
      existing.outputTokens += entry.outputTokens;
      existing.totalTokens += entry.inputTokens + entry.outputTokens;
      existing.cost += calculateCost(entry.inputTokens, entry.outputTokens, entry.model);
    } else {
      aggregated.set(key, {
        agentId,
        agentName: agentId.charAt(0).toUpperCase() + agentId.slice(1),
        date,
        runs: 1,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        totalTokens: entry.inputTokens + entry.outputTokens,
        cost: calculateCost(entry.inputTokens, entry.outputTokens, entry.model),
      });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Aggregate usage entries by date
 */
export function aggregateByDate(entries: OpenClawUsageEntry[]): DailyCost[] {
  const byAgent = aggregateByAgentAndDate(entries);
  const dailyMap = new Map<string, DailyCost>();

  for (const agentData of byAgent) {
    const existing = dailyMap.get(agentData.date);
    if (existing) {
      existing.totalCost += agentData.cost;
      existing.totalTokens += agentData.totalTokens;
      existing.byAgent[agentData.agentId] = agentData.cost;
    } else {
      dailyMap.set(agentData.date, {
        date: agentData.date,
        totalCost: agentData.cost,
        totalTokens: agentData.totalTokens,
        byAgent: { [agentData.agentId]: agentData.cost },
      });
    }
  }

  // Sort by date
  return Array.from(dailyMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

/**
 * Calculate period totals and changes
 */
export function calculateCostSummary(
  entries: OpenClawUsageEntry[],
  period: "day" | "week" | "month" = "week"
): CostSummary {
  const now = new Date();
  const periodDays = period === "day" ? 1 : period === "week" ? 7 : 30;

  // Filter entries for current period
  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const periodEntries = entries.filter(e => new Date(e.timestamp) >= cutoff);

  // Filter entries for previous period (for comparison)
  const prevCutoff = new Date(cutoff.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const prevEntries = entries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= prevCutoff && d < cutoff;
  });

  // Calculate current period totals
  const byAgent = aggregateByAgentAndDate(periodEntries);
  const daily = aggregateByDate(periodEntries);

  const totalCost = byAgent.reduce((sum, a) => sum + a.cost, 0);
  const totalTokens = byAgent.reduce((sum, a) => sum + a.totalTokens, 0);
  const totalRuns = byAgent.reduce((sum, a) => sum + a.runs, 0);

  // Calculate previous period totals
  const prevByAgent = aggregateByAgentAndDate(prevEntries);
  const prevTotalCost = prevByAgent.reduce((sum, a) => sum + a.cost, 0);
  const prevTotalTokens = prevByAgent.reduce((sum, a) => sum + a.totalTokens, 0);
  const prevTotalRuns = prevByAgent.reduce((sum, a) => sum + a.runs, 0);

  // Calculate percentage changes (avoid division by zero)
  const costChange = prevTotalCost > 0 
    ? ((totalCost - prevTotalCost) / prevTotalCost) * 100 
    : 0;
  const tokenChange = prevTotalTokens > 0 
    ? ((totalTokens - prevTotalTokens) / prevTotalTokens) * 100 
    : 0;
  const runChange = prevTotalRuns > 0 
    ? ((totalRuns - prevTotalRuns) / prevTotalRuns) * 100 
    : 0;

  return {
    period,
    totalCost,
    totalTokens,
    totalRuns,
    costChange,
    tokenChange,
    runChange,
    byAgent,
    daily,
  };
}

// ============================================================================
// OpenClaw Integration
// ============================================================================

/**
 * Parse usage log line (if OpenClaw writes usage to a log file)
 * Expected format: TIMESTAMP|SESSION_KEY|MODEL|INPUT_TOKENS|OUTPUT_TOKENS
 */
export function parseUsageLogLine(line: string): OpenClawUsageEntry | null {
  const parts = line.split("|");
  if (parts.length < 5) return null;

  const [timestamp, sessionKey, model, inputStr, outputStr] = parts;
  const inputTokens = parseInt(inputStr, 10);
  const outputTokens = parseInt(outputStr, 10);

  if (isNaN(inputTokens) || isNaN(outputTokens)) return null;

  return {
    sessionKey,
    agentId: extractAgentId(sessionKey) || "unknown",
    model,
    inputTokens,
    outputTokens,
    timestamp,
  };
}

/**
 * Parse usage log file content
 */
export function parseUsageLog(content: string): OpenClawUsageEntry[] {
  const entries: OpenClawUsageEntry[] = [];
  const lines = content.trim().split("\n").filter(l => l && !l.startsWith("#"));

  for (const line of lines) {
    const entry = parseUsageLogLine(line);
    if (entry) entries.push(entry);
  }

  return entries;
}

/**
 * Parse JSON usage data (alternative format)
 */
export function parseUsageJson(data: unknown[]): OpenClawUsageEntry[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is Record<string, unknown> => 
      item !== null && typeof item === "object"
    )
    .map(item => ({
      sessionKey: String(item.sessionKey || item.session_key || ""),
      agentId: String(item.agentId || item.agent_id || extractAgentId(String(item.sessionKey || "")) || "unknown"),
      model: String(item.model || "default"),
      inputTokens: Number(item.inputTokens || item.input_tokens || 0),
      outputTokens: Number(item.outputTokens || item.output_tokens || 0),
      timestamp: String(item.timestamp || item.created_at || new Date().toISOString()),
    }))
    .filter(e => e.sessionKey || e.agentId !== "unknown");
}

// ============================================================================
// Mock Data Generation (for testing)
// ============================================================================

/**
 * Generate mock usage data for testing
 */
export function generateMockUsageData(
  days: number = 7,
  agentIds: string[] = ["klaus", "iris", "forge", "oracle", "atlas"]
): OpenClawUsageEntry[] {
  const entries: OpenClawUsageEntry[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    
    for (const agentId of agentIds) {
      // Random number of runs per day (1-10)
      const runs = Math.floor(Math.random() * 10) + 1;
      
      for (let r = 0; r < runs; r++) {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        date.setHours(hour, minute, 0, 0);

        entries.push({
          sessionKey: `agent:${agentId}:main`,
          agentId,
          model: "claude-3.5-sonnet",
          inputTokens: Math.floor(Math.random() * 5000) + 500,
          outputTokens: Math.floor(Math.random() * 2000) + 200,
          timestamp: date.toISOString(),
        });
      }
    }
  }

  return entries;
}
