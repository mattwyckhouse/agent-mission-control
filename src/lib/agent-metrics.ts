/**
 * Agent Metrics Generator
 * 
 * Generates varied but deterministic mock metrics for each agent.
 * Uses agent ID as seed for consistent values across renders.
 */

// Simple hash function for deterministic "random" values
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded pseudo-random generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Agent characteristic profiles (affects their metrics)
const AGENT_PROFILES: Record<string, {
  avgRuns: number;
  avgTokens: number;
  costMultiplier: number;
  responseSpeed: "fast" | "medium" | "slow";
  reliability: "high" | "medium" | "low";
}> = {
  klaus: { avgRuns: 45, avgTokens: 85000, costMultiplier: 1.2, responseSpeed: "fast", reliability: "high" },
  iris: { avgRuns: 120, avgTokens: 25000, costMultiplier: 0.6, responseSpeed: "fast", reliability: "high" },
  atlas: { avgRuns: 15, avgTokens: 8000, costMultiplier: 0.3, responseSpeed: "medium", reliability: "high" },
  oracle: { avgRuns: 8, avgTokens: 45000, costMultiplier: 1.5, responseSpeed: "slow", reliability: "medium" },
  sentinel: { avgRuns: 25, avgTokens: 15000, costMultiplier: 0.5, responseSpeed: "medium", reliability: "high" },
  herald: { avgRuns: 12, avgTokens: 35000, costMultiplier: 1.0, responseSpeed: "medium", reliability: "high" },
  forge: { avgRuns: 35, avgTokens: 150000, costMultiplier: 2.5, responseSpeed: "slow", reliability: "medium" },
  aegis: { avgRuns: 20, avgTokens: 30000, costMultiplier: 0.8, responseSpeed: "fast", reliability: "high" },
  codex: { avgRuns: 10, avgTokens: 20000, costMultiplier: 0.6, responseSpeed: "medium", reliability: "high" },
  pixel: { avgRuns: 5, avgTokens: 12000, costMultiplier: 0.4, responseSpeed: "slow", reliability: "medium" },
  pathfinder: { avgRuns: 8, avgTokens: 18000, costMultiplier: 0.5, responseSpeed: "medium", reliability: "high" },
  curator: { avgRuns: 3, avgTokens: 10000, costMultiplier: 0.3, responseSpeed: "slow", reliability: "medium" },
  steward: { avgRuns: 6, avgTokens: 8000, costMultiplier: 0.2, responseSpeed: "fast", reliability: "high" },
};

// Default profile for unknown agents
const DEFAULT_PROFILE = {
  avgRuns: 10,
  avgTokens: 20000,
  costMultiplier: 0.5,
  responseSpeed: "medium" as const,
  reliability: "medium" as const,
};

export interface AgentMetrics {
  runs: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  avgResponseTime: string;
  successRate: string;
  tokensPerRun: number;
  costTrend: string;
  costTrendDirection: "up" | "down" | "neutral";
}

export interface DailyMetric {
  date: string;
  value: number;
}

/**
 * Generate metrics for a specific agent
 */
export function getAgentMetrics(agentId: string): AgentMetrics {
  const profile = AGENT_PROFILES[agentId] || DEFAULT_PROFILE;
  const hash = hashCode(agentId);
  const random = seededRandom(hash);
  
  // Add variance to base values (±30%)
  const variance = () => 0.7 + random() * 0.6;
  
  const runs = Math.floor(profile.avgRuns * variance());
  const totalTokens = Math.floor(profile.avgTokens * variance());
  const inputTokens = Math.floor(totalTokens * 0.7);
  const outputTokens = totalTokens - inputTokens;
  
  // Cost calculation: $0.003 per 1K input, $0.015 per 1K output (Claude-like pricing)
  const cost = ((inputTokens * 0.003 + outputTokens * 0.015) / 1000) * profile.costMultiplier;
  
  // Response time based on speed profile
  const baseResponseTime = {
    fast: 5 + random() * 8,
    medium: 12 + random() * 15,
    slow: 25 + random() * 20,
  }[profile.responseSpeed];
  
  // Success rate based on reliability
  const baseSuccessRate = {
    high: 96 + random() * 4,
    medium: 88 + random() * 10,
    low: 75 + random() * 15,
  }[profile.reliability];
  
  // Cost trend (varied per agent)
  const trendValue = (random() - 0.5) * 40; // -20% to +20%
  const trendDirection = trendValue > 5 ? "up" : trendValue < -5 ? "down" : "neutral";
  
  return {
    runs,
    totalTokens,
    inputTokens,
    outputTokens,
    cost: Math.round(cost * 100) / 100,
    avgResponseTime: `${baseResponseTime.toFixed(1)}s`,
    successRate: `${baseSuccessRate.toFixed(1)}%`,
    tokensPerRun: Math.floor(totalTokens / Math.max(runs, 1)),
    costTrend: `${trendValue > 0 ? "+" : ""}${trendValue.toFixed(0)}%`,
    costTrendDirection: trendDirection,
  };
}

/**
 * Generate daily cost data for sparklines (last 7 days)
 */
export function getAgentDailyCosts(agentId: string): DailyMetric[] {
  const profile = AGENT_PROFILES[agentId] || DEFAULT_PROFILE;
  const hash = hashCode(agentId + "daily");
  const random = seededRandom(hash);
  
  const baseCost = (profile.avgTokens * 0.01 / 1000) * profile.costMultiplier;
  const days: DailyMetric[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add daily variance (±40%)
    const variance = 0.6 + random() * 0.8;
    const value = baseCost * variance;
    
    days.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
  }
  
  return days;
}

/**
 * Generate activity counts for sparklines
 */
export function getAgentActivityCounts(agentId: string): DailyMetric[] {
  const profile = AGENT_PROFILES[agentId] || DEFAULT_PROFILE;
  const hash = hashCode(agentId + "activity");
  const random = seededRandom(hash);
  
  const days: DailyMetric[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Activity based on runs with variance
    const baseActivity = profile.avgRuns / 7;
    const variance = 0.3 + random() * 1.4;
    const value = Math.floor(baseActivity * variance);
    
    days.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      value,
    });
  }
  
  return days;
}

/**
 * Get summary metrics for dashboard
 */
export function getAllAgentsSummary(): {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  activeAgents: number;
} {
  let totalRuns = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let activeAgents = 0;
  
  for (const agentId of Object.keys(AGENT_PROFILES)) {
    const metrics = getAgentMetrics(agentId);
    totalRuns += metrics.runs;
    totalTokens += metrics.totalTokens;
    totalCost += metrics.cost;
    if (metrics.runs > 0) activeAgents++;
  }
  
  return {
    totalRuns,
    totalTokens,
    totalCost: Math.round(totalCost * 100) / 100,
    activeAgents,
  };
}
