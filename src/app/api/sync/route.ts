/**
 * OpenClaw Sync API Route
 * 
 * POST /api/sync — Receive sync data from OpenClaw and upsert to Supabase
 * GET /api/sync — Get last sync status
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Type for the sync payload
interface SyncPayload {
  agents: Array<{
    id: string;
    name: string;
    display_name: string;
    emoji: string | null;
    domain: string;
    description: string | null;
    soul_path: string | null;
    skills: unknown[];
    tools: unknown[];
    status: string;
    session_key: string | null;
    last_heartbeat: string | null;
    current_task_id: string | null;
    heartbeat_schedule: string | null;
    heartbeat_interval_minutes: number | null;
    updated_at: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigned_agent_id: string | null;
    created_by: string | null;
    parent_task_id: string | null;
    context: Record<string, unknown>;
    tags: string[];
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  }>;
  activities: Array<{
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    agent_id: string | null;
    task_id: string | null;
    message_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  synced_at: string;
}

interface SyncResult {
  success: boolean;
  synced_at: string;
  counts: {
    agents_upserted: number;
    tasks_upserted: number;
    activities_inserted: number;
  };
  errors: string[];
}

/**
 * POST /api/sync
 * 
 * Receives sync data from OpenClaw and upserts to Supabase.
 * Expects a SyncPayload in the request body.
 */
export async function POST(request: NextRequest): Promise<NextResponse<SyncResult>> {
  const errors: string[] = [];
  const counts = {
    agents_upserted: 0,
    tasks_upserted: 0,
    activities_inserted: 0,
  };

  try {
    // Parse request body
    const payload: SyncPayload = await request.json();
    
    // Validate required fields
    if (!payload.agents || !payload.tasks || !payload.synced_at) {
      return NextResponse.json({
        success: false,
        synced_at: new Date().toISOString(),
        counts,
        errors: ["Invalid payload: missing agents, tasks, or synced_at"],
      }, { status: 400 });
    }

    const supabase = await createClient();

    // ========================================================================
    // Upsert Agents
    // ========================================================================
    if (payload.agents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentData = payload.agents.map(a => ({
        id: a.id,
        name: a.name,
        display_name: a.display_name,
        emoji: a.emoji,
        domain: a.domain,
        description: a.description,
        soul_path: a.soul_path,
        skills: a.skills,
        tools: a.tools,
        status: a.status,
        session_key: a.session_key,
        last_heartbeat: a.last_heartbeat,
        current_task_id: a.current_task_id,
        heartbeat_schedule: a.heartbeat_schedule,
        heartbeat_interval_minutes: a.heartbeat_interval_minutes,
        updated_at: a.updated_at,
      })) as any; // Type assertion - regenerate Supabase types to fix properly
      
      const { error: agentsError, count } = await supabase
        .from("agents")
        .upsert(agentData, { onConflict: "id", count: "exact" });

      if (agentsError) {
        errors.push(`Agents upsert failed: ${agentsError.message}`);
      } else {
        counts.agents_upserted = count ?? payload.agents.length;
      }
    }

    // ========================================================================
    // Upsert Tasks
    // ========================================================================
    if (payload.tasks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const taskData = payload.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigned_agent_id: t.assigned_agent_id,
        created_by: t.created_by,
        parent_task_id: t.parent_task_id,
        context: t.context,
        tags: t.tags,
        due_date: t.due_date,
        started_at: t.started_at,
        completed_at: t.completed_at,
        updated_at: t.updated_at,
      })) as any; // Type assertion - regenerate Supabase types to fix properly
      
      const { error: tasksError, count } = await supabase
        .from("tasks")
        .upsert(taskData, { onConflict: "id", count: "exact" });

      if (tasksError) {
        errors.push(`Tasks upsert failed: ${tasksError.message}`);
      } else {
        counts.tasks_upserted = count ?? payload.tasks.length;
      }
    }

    // ========================================================================
    // Insert Activities (skip duplicates)
    // ========================================================================
    if (payload.activities && payload.activities.length > 0) {
      // Get existing activity IDs to avoid duplicates
      const activityIds = payload.activities.map(a => a.id);
      const { data: existingActivities } = await supabase
        .from("activities")
        .select("id")
        .in("id", activityIds);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingIds = new Set((existingActivities as any[])?.map(a => a.id) ?? []);
      const newActivities = payload.activities.filter(a => !existingIds.has(a.id));

      if (newActivities.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activityData = newActivities.map(a => ({
          id: a.id,
          activity_type: a.activity_type,
          title: a.title,
          description: a.description,
          agent_id: a.agent_id,
          task_id: a.task_id,
          message_id: a.message_id,
          metadata: a.metadata,
          created_at: a.created_at,
        })) as any; // Type assertion - regenerate Supabase types to fix properly
        
        const { error: activitiesError, count } = await supabase
          .from("activities")
          .insert(activityData, { count: "exact" }
          );

        if (activitiesError) {
          errors.push(`Activities insert failed: ${activitiesError.message}`);
        } else {
          counts.activities_inserted = count ?? newActivities.length;
        }
      }
    }

    // ========================================================================
    // Record sync event
    // ========================================================================
    // Insert a system activity to track sync time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("activities").insert({
      activity_type: "system_event",
      title: "Data synced from OpenClaw",
      description: `Synced ${counts.agents_upserted} agents, ${counts.tasks_upserted} tasks, ${counts.activities_inserted} activities`,
      metadata: { counts, synced_at: payload.synced_at },
    } as any);

    return NextResponse.json({
      success: errors.length === 0,
      synced_at: payload.synced_at,
      counts,
      errors,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      synced_at: new Date().toISOString(),
      counts,
      errors: [`Sync failed: ${message}`],
    }, { status: 500 });
  }
}

/**
 * GET /api/sync
 * 
 * Returns the last sync status by querying the most recent system_event activity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Get most recent sync event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await supabase
      .from("activities")
      .select("*")
      .eq("activity_type", "system_event")
      .ilike("title", "%synced from OpenClaw%")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    const data = result.data as any;
    const error = result.error;

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        last_sync: null,
        message: "No sync has been performed yet",
      });
    }

    const metadata = data.metadata as { counts?: object; synced_at?: string } | null;

    return NextResponse.json({
      last_sync: data.created_at,
      synced_at: metadata?.synced_at ?? data.created_at,
      counts: metadata?.counts ?? {},
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
