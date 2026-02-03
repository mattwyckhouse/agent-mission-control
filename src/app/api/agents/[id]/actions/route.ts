import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  type ActionRequest, 
  type ActionResponse, 
  type ActionResult,
  isValidActionType,
} from "@/types/actions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/agents/[id]/actions
 * 
 * Execute an action on an agent (start, stop, restart, message, heartbeat)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ActionResponse | { error: string }>> {
  try {
    const { id: agentId } = await params;
    const body = await request.json() as ActionRequest;

    // Validate action type
    if (!body.type || !isValidActionType(body.type)) {
      return NextResponse.json(
        { error: `Invalid action type: ${body.type}. Valid types: start, stop, restart, message, heartbeat` },
        { status: 400 }
      );
    }

    // Validate message is provided for message action
    if (body.type === "message" && !body.message) {
      return NextResponse.json(
        { error: "Message is required for message action" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify agent exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, status")
      .eq("id", agentId)
      .single() as { data: { id: string; name: string; status: string } | null; error: any };

    if (agentError || !agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    // Generate action ID
    const actionId = `action-${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // Execute the action based on type
    let result: ActionResult;

    switch (body.type) {
      case "start":
        result = await executeStartAction(agentId, actionId, now);
        break;
      case "stop":
        result = await executeStopAction(agentId, actionId, now);
        break;
      case "restart":
        result = await executeRestartAction(agentId, actionId, now);
        break;
      case "message":
        result = await executeMessageAction(agentId, actionId, body.message!, now);
        break;
      case "heartbeat":
        result = await executeHeartbeatAction(agentId, actionId, now);
        break;
      default:
        return NextResponse.json(
          { error: `Unhandled action type: ${body.type}` },
          { status: 400 }
        );
    }

    // Log the action to activities table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("activities").insert({
      activity_type: "agent_action",
      title: `${body.type} action on ${agent.name}`,
      description: result.message,
      agent_id: agentId,
      metadata: {
        actionId,
        actionType: body.type,
        status: result.status,
        message: body.message,
      },
    } as any);

    return NextResponse.json({
      success: result.status === "completed",
      actionId,
      result,
    });

  } catch (error) {
    console.error("[Agent Action] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/[id]/actions
 * 
 * Get action history for an agent
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const supabase = await createClient();

    // Get action history from activities
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("agent_id", agentId)
      .eq("activity_type", "agent_action")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform to action history format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history = (activities || []).map((a: any) => ({
      id: a.metadata?.actionId || a.id,
      agentId: a.agent_id,
      type: a.metadata?.actionType || "unknown",
      status: a.metadata?.status || "completed",
      message: a.description,
      requestedBy: "user",
      requestedAt: a.created_at,
    }));

    return NextResponse.json({ history });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Action Executors
// ============================================================================

async function executeStartAction(
  agentId: string,
  actionId: string,
  requestedAt: string
): Promise<ActionResult> {
  // TODO: Integrate with OpenClaw to actually start the agent
  // For now, return a simulated result
  return {
    id: actionId,
    action: {
      type: "start",
      agentId,
      requestedAt,
      requestedBy: "user",
    },
    status: "completed",
    message: `Agent ${agentId} start requested. Note: OpenClaw integration pending.`,
    startedAt: requestedAt,
    completedAt: new Date().toISOString(),
    durationMs: 100,
  };
}

async function executeStopAction(
  agentId: string,
  actionId: string,
  requestedAt: string
): Promise<ActionResult> {
  // TODO: Integrate with OpenClaw to actually stop the agent
  return {
    id: actionId,
    action: {
      type: "stop",
      agentId,
      requestedAt,
      requestedBy: "user",
    },
    status: "completed",
    message: `Agent ${agentId} stop requested. Note: OpenClaw integration pending.`,
    startedAt: requestedAt,
    completedAt: new Date().toISOString(),
    durationMs: 100,
  };
}

async function executeRestartAction(
  agentId: string,
  actionId: string,
  requestedAt: string
): Promise<ActionResult> {
  // TODO: Integrate with OpenClaw to actually restart the agent
  return {
    id: actionId,
    action: {
      type: "restart",
      agentId,
      requestedAt,
      requestedBy: "user",
    },
    status: "completed",
    message: `Agent ${agentId} restart requested. Note: OpenClaw integration pending.`,
    startedAt: requestedAt,
    completedAt: new Date().toISOString(),
    durationMs: 200,
  };
}

async function executeMessageAction(
  agentId: string,
  actionId: string,
  message: string,
  requestedAt: string
): Promise<ActionResult> {
  // TODO: Integrate with OpenClaw sessions_send to deliver message
  return {
    id: actionId,
    action: {
      type: "message",
      agentId,
      message,
      requestedAt,
      requestedBy: "user",
    },
    status: "completed",
    message: `Message sent to ${agentId}: "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}"`,
    output: message,
    startedAt: requestedAt,
    completedAt: new Date().toISOString(),
    durationMs: 50,
  };
}

async function executeHeartbeatAction(
  agentId: string,
  actionId: string,
  requestedAt: string
): Promise<ActionResult> {
  // TODO: Integrate with OpenClaw cron to trigger heartbeat
  return {
    id: actionId,
    action: {
      type: "heartbeat",
      agentId,
      requestedAt,
      requestedBy: "user",
    },
    status: "completed",
    message: `Heartbeat triggered for ${agentId}. Note: OpenClaw integration pending.`,
    startedAt: requestedAt,
    completedAt: new Date().toISOString(),
    durationMs: 100,
  };
}
