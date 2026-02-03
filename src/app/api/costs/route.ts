import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateByAgentAndDate,
  aggregateByDate,
  calculateCostSummary,
  generateMockUsageData,
  type OpenClawUsageEntry,
} from "@/lib/openclaw/costs";

/**
 * GET /api/costs
 * 
 * Get cost data with optional filters
 * 
 * Query params:
 * - period: "day" | "week" | "month" (default: "week")
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 * - agentId: Filter by specific agent
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as "day" | "week" | "month" || "week";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agentId = searchParams.get("agentId");

    const supabase = await createClient();

    // Try to fetch real usage data from activities table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase
      .from("activities")
      .select("*")
      .in("activity_type", ["agent_action", "session_completed"])
      .order("created_at", { ascending: false });

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59Z`);
    }
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activities, error } = await query.limit(1000) as { data: any[]; error: any };

    let usageEntries: OpenClawUsageEntry[];

    if (error || !activities || activities.length === 0) {
      // Fall back to mock data for demo
      usageEntries = generateMockUsageData(30);
    } else {
      // Transform activities to usage entries
      usageEntries = activities
        .filter(a => a.metadata?.inputTokens || a.metadata?.input_tokens)
        .map(a => ({
          sessionKey: a.metadata?.sessionKey || `agent:${a.agent_id}:main`,
          agentId: a.agent_id || "unknown",
          model: a.metadata?.model || "default",
          inputTokens: a.metadata?.inputTokens || a.metadata?.input_tokens || 0,
          outputTokens: a.metadata?.outputTokens || a.metadata?.output_tokens || 0,
          timestamp: a.created_at,
        }));

      // If still no real usage data, use mock
      if (usageEntries.length === 0) {
        usageEntries = generateMockUsageData(30);
      }
    }

    // Filter by date range if provided
    if (startDate) {
      usageEntries = usageEntries.filter(e => e.timestamp >= `${startDate}T00:00:00`);
    }
    if (endDate) {
      usageEntries = usageEntries.filter(e => e.timestamp <= `${endDate}T23:59:59`);
    }

    // Calculate summary
    const summary = calculateCostSummary(usageEntries, period);

    // Get aggregations
    const byAgentAndDate = aggregateByAgentAndDate(usageEntries);
    const byDate = aggregateByDate(usageEntries);

    return NextResponse.json({
      summary,
      byAgent: summary.byAgent,
      daily: byDate,
      period,
      startDate: startDate || byDate[0]?.date,
      endDate: endDate || byDate[byDate.length - 1]?.date,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
