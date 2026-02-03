import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus, TaskPriority } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_agent_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

/**
 * GET /api/tasks/[id]
 * 
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single() as { data: any; error: any };

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: `Task not found: ${id}` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * 
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json() as UpdateTaskRequest;

    const supabase = await createClient();

    // Get current task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single() as { data: any; error: any };

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: `Task not found: ${id}` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) {
      updates.status = body.status;
      // Track status transitions
      if (body.status === "in_progress" && !currentTask.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (body.status === "done" && !currentTask.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (body.assigned_agent_id !== undefined) updates.assigned_agent_id = body.assigned_agent_id;
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.tags !== undefined) updates.tags = body.tags;

    // Update task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase
      .from("tasks") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    const task = result.data;
    const error = result.error;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log activity for status changes
    if (body.status && body.status !== currentTask.status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("activities").insert({
        activity_type: body.status === "done" ? "task_completed" : "task_updated",
        title: `Task ${body.status === "done" ? "completed" : "updated"}: ${currentTask.title}`,
        description: `Status changed from ${currentTask.status} to ${body.status}`,
        task_id: id,
        agent_id: currentTask.assigned_agent_id,
        metadata: { 
          previousStatus: currentTask.status, 
          newStatus: body.status,
        },
      } as any);
    }

    return NextResponse.json({ task });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * 
 * Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get task before deleting (for activity log)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("title, assigned_agent_id")
      .eq("id", id)
      .single() as { data: any; error: any };

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: `Task not found: ${id}` },
          { status: 404 }
        );
      }
    }

    // Delete task
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log activity
    if (task) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("activities").insert({
        activity_type: "task_updated",
        title: `Task deleted: ${task.title}`,
        description: null,
        task_id: id,
        agent_id: task.assigned_agent_id,
        metadata: { action: "deleted" },
      } as any);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
