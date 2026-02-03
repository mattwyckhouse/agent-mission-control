import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskStatus, TaskPriority } from "@/types";

interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_agent_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

/**
 * GET /api/tasks
 * 
 * List tasks with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const agentId = searchParams.get("agent_id");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const supabase = await createClient();

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      const statuses = status.split(",");
      query = query.in("status", statuses);
    }

    if (agentId) {
      query = query.eq("assigned_agent_id", agentId);
    }

    if (priority) {
      const priorities = priority.split(",");
      query = query.in("priority", priorities);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks, error } = await query as { data: Task[] | null; error: any };

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: tasks || [] });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * 
 * Create a new task
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as CreateTaskRequest;

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate a unique ID
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Build task object
    const task = {
      id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      priority: body.priority || "medium",
      status: body.status || "inbox",
      assigned_agent_id: body.assigned_agent_id || null,
      due_date: body.due_date || null,
      tags: body.tags || [],
      context: {},
      created_by: null,
      parent_task_id: null,
      started_at: null,
      completed_at: null,
    };

    // Insert task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("tasks")
      .insert(task as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("activities").insert({
      activity_type: "task_created",
      title: `Task created: ${body.title}`,
      description: body.description || null,
      task_id: id,
      agent_id: body.assigned_agent_id || null,
      metadata: { priority: body.priority, status: body.status },
    } as any);

    return NextResponse.json({ task: data }, { status: 201 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
