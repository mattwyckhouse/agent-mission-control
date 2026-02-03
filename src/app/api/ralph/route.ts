import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RalphLoop } from "@/types";

/**
 * GET /api/ralph
 * 
 * Returns Ralph build data from Supabase ralph_builds table
 * or falls back to parsing progress.md files if table doesn't exist.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Try to fetch from ralph_builds table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: builds, error } = await supabase
      .from("ralph_builds")
      .select("*")
      .order("created_at", { ascending: false }) as { data: any[] | null; error: any };
    
    if (error) {
      // Table might not exist yet - return empty state
      console.warn("Ralph builds table not available:", error.message);
      return NextResponse.json({
        activeBuilds: [],
        completedBuilds: [],
        stats: {
          totalLoops: 0,
          completed: 0,
          blocked: 0,
          totalCost: 0,
        },
      });
    }

    // Transform to RalphLoop format
    const loops: RalphLoop[] = (builds || []).map((b) => ({
      id: b.id,
      buildId: b.build_id || b.id,
      name: b.name,
      agent: b.agent_id || "forge",
      phase: mapPhase(b.status),
      currentStep: b.current_step || 0,
      totalSteps: b.total_steps || 48,
      startedAt: b.started_at || b.created_at,
      lastUpdate: b.updated_at,
      tokensUsed: b.tokens_used || 0,
      cost: b.cost || 0,
      output: b.output || [],
      estimatedCompletion: b.estimated_completion,
    }));

    // Separate active and completed
    const activeBuilds = loops.filter(
      (l) => l.phase !== "done" && l.phase !== "blocked"
    );
    const completedBuilds = loops.filter(
      (l) => l.phase === "done" || l.phase === "blocked"
    );

    // Calculate stats
    const stats = {
      totalLoops: loops.length,
      completed: loops.filter((l) => l.phase === "done").length,
      blocked: loops.filter((l) => l.phase === "blocked").length,
      totalCost: loops.reduce((sum, l) => sum + l.cost, 0),
    };

    return NextResponse.json({
      activeBuilds,
      completedBuilds,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapPhase(status: string): RalphLoop["phase"] {
  switch (status?.toLowerCase()) {
    case "done":
    case "completed":
    case "complete":
      return "done";
    case "blocked":
    case "failed":
    case "error":
      return "blocked";
    case "interview":
      return "interview";
    case "plan":
    case "planning":
      return "plan";
    case "build":
    case "building":
    case "in_progress":
    default:
      return "build";
  }
}
