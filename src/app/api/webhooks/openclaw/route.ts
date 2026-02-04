/**
 * OpenClaw Webhook Endpoint
 * 
 * Receives events from OpenClaw gateway for real-time dashboard updates.
 * 
 * Supported events:
 * - agent:status — Agent came online/offline
 * - agent:heartbeat — Agent heartbeat with metrics
 * - message:sent — Inter-agent message sent (future)
 * - message:received — Message received (future)
 * - task:created — New task created
 * - task:updated — Task status changed
 * - alert:triggered — Cost/usage alert triggered
 * - gateway:startup — Gateway started
 * - gateway:shutdown — Gateway shutting down
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Webhook event types
type WebhookEventType = 
  | "agent:status"
  | "agent:heartbeat"
  | "message:sent"
  | "message:received"
  | "task:created"
  | "task:updated"
  | "alert:triggered"
  | "gateway:startup"
  | "gateway:shutdown"
  | "custom";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  source?: string; // Which gateway/agent sent this
  data: Record<string, unknown>;
}

// Helper to resolve agent name to UUID
async function resolveAgentId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentIdOrName: string | null
): Promise<string | null> {
  if (!agentIdOrName) return null;
  
  if (agentIdOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return agentIdOrName;
  }
  
  const { data } = await supabase
    .from("agents")
    .select("id")
    .eq("name", agentIdOrName.toLowerCase())
    .single();
  
  return (data as { id: string } | null)?.id || null;
}

// Process different event types
async function processEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: WebhookPayload
) {
  const { event, timestamp, source, data } = payload;

  switch (event) {
    case "agent:status": {
      // Update agent status in database
      const agentId = await resolveAgentId(supabase, data.agent_id as string);
      if (agentId) {
        await supabase
          .from("agents")
          .update({
            status: data.status as string,
            last_seen_at: timestamp,
            metadata: {
              ...(data.metadata as Record<string, unknown> || {}),
              last_status_event: timestamp,
            },
          } as never)
          .eq("id", agentId);
      }
      return { processed: true, type: "agent:status", agent_id: agentId };
    }

    case "agent:heartbeat": {
      // Log heartbeat metrics
      const agentId = await resolveAgentId(supabase, data.agent_id as string);
      if (agentId) {
        // Update last_seen
        await supabase
          .from("agents")
          .update({
            last_seen_at: timestamp,
            status: "active",
          } as never)
          .eq("id", agentId);

        // Could also store heartbeat metrics in a separate table if needed
      }
      return { processed: true, type: "agent:heartbeat", agent_id: agentId };
    }

    case "message:sent":
    case "message:received": {
      // Log inter-agent message
      const fromAgentId = await resolveAgentId(supabase, data.from_agent as string);
      const toAgentId = await resolveAgentId(supabase, data.to_agent as string);

      const { error } = await supabase.from("messages").insert({
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        from_human: data.from_human || false,
        to_human: data.to_human || false,
        content: data.content as string,
        message_type: data.message_type || "session_send",
        task_id: data.task_id || null,
        thread_id: data.thread_id || null,
        metadata: {
          source: "webhook",
          event_type: event,
          original_timestamp: timestamp,
          ...(data.metadata as Record<string, unknown> || {}),
        },
      } as never);

      if (error) {
        console.error("Failed to log message from webhook:", error);
        return { processed: false, type: event, error: error.message };
      }

      return { processed: true, type: event };
    }

    case "task:created":
    case "task:updated": {
      // Handle task events
      const taskData = data.task as Record<string, unknown>;
      if (!taskData) {
        return { processed: false, type: event, error: "No task data provided" };
      }

      if (event === "task:created") {
        const assignedTo = await resolveAgentId(supabase, taskData.assigned_to as string);
        const { error } = await supabase.from("tasks").insert({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || "pending",
          priority: taskData.priority || "medium",
          assigned_to: assignedTo,
          due_date: taskData.due_date,
          metadata: {
            source: "webhook",
            ...(taskData.metadata as Record<string, unknown> || {}),
          },
        } as never);

        if (error) {
          return { processed: false, type: event, error: error.message };
        }
      } else {
        // task:updated
        const taskId = taskData.id as string;
        if (!taskId) {
          return { processed: false, type: event, error: "No task ID for update" };
        }

        const updateData: Record<string, unknown> = {};
        if (taskData.status) updateData.status = taskData.status;
        if (taskData.priority) updateData.priority = taskData.priority;
        if (taskData.title) updateData.title = taskData.title;
        if (taskData.description) updateData.description = taskData.description;
        updateData.updated_at = timestamp;

        const { error } = await supabase
          .from("tasks")
          .update(updateData as never)
          .eq("id", taskId);

        if (error) {
          return { processed: false, type: event, error: error.message };
        }
      }

      return { processed: true, type: event };
    }

    case "alert:triggered": {
      // Store alert for dashboard notification
      // For now, just log to messages as an escalation
      const { error } = await supabase.from("messages").insert({
        from_agent_id: null,
        to_agent_id: null,
        from_human: false,
        to_human: true, // Alert goes to Matt
        content: `🚨 Alert: ${data.title || "System Alert"}\n\n${data.message || "No details provided."}`,
        message_type: "escalation",
        metadata: {
          source: "webhook",
          event_type: "alert:triggered",
          alert_type: data.alert_type,
          threshold: data.threshold,
          current_value: data.current_value,
          ...(data.metadata as Record<string, unknown> || {}),
        },
      } as never);

      if (error) {
        return { processed: false, type: event, error: error.message };
      }

      return { processed: true, type: event };
    }

    case "gateway:startup":
    case "gateway:shutdown": {
      // Log gateway lifecycle events
      const { error } = await supabase.from("messages").insert({
        from_agent_id: null,
        to_agent_id: null,
        from_human: false,
        to_human: false,
        content: event === "gateway:startup" 
          ? `🟢 Gateway started: ${source || "unknown"}`
          : `🔴 Gateway shutdown: ${source || "unknown"}`,
        message_type: "report",
        metadata: {
          source: "webhook",
          event_type: event,
          gateway_source: source,
          ...(data as Record<string, unknown>),
        },
      } as never);

      if (error) {
        return { processed: false, type: event, error: error.message };
      }

      return { processed: true, type: event };
    }

    default:
      // Log unknown events for debugging
      console.log(`Unknown webhook event: ${event}`, data);
      return { processed: false, type: event, error: "Unknown event type" };
  }
}

// POST — Receive webhook events from OpenClaw
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook signature
    const signature = request.headers.get("x-openclaw-signature");
    const webhookSecret = process.env.OPENCLAW_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      // For now, just log that we received a signed request
      console.log("Received signed webhook request");
    }

    const body = await request.json();

    // Support single event or batch of events
    const events: WebhookPayload[] = Array.isArray(body) ? body : [body];

    const results: Array<{ processed: boolean; type?: string; error?: string; [key: string]: unknown }> = [];
    const supabase = await createClient();

    for (const payload of events) {
      // Validate required fields
      if (!payload.event) {
        results.push({ processed: false, error: "Missing event type" });
        continue;
      }

      // Add timestamp if not provided
      if (!payload.timestamp) {
        payload.timestamp = new Date().toISOString();
      }

      const result = await processEvent(supabase, payload);
      results.push(result);
    }

    const successCount = results.filter(r => r.processed).length;
    const failCount = results.filter(r => !r.processed).length;

    return NextResponse.json({
      success: true,
      processed: successCount,
      failed: failCount,
      results,
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — Health check / webhook info
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "/api/webhooks/openclaw",
    supported_events: [
      "agent:status",
      "agent:heartbeat",
      "message:sent",
      "message:received",
      "task:created",
      "task:updated",
      "alert:triggered",
      "gateway:startup",
      "gateway:shutdown",
    ],
    docs: "POST events to this endpoint. Include 'event' and 'data' fields.",
    example: {
      event: "agent:status",
      timestamp: new Date().toISOString(),
      source: "gateway-main",
      data: {
        agent_id: "klaus",
        status: "active",
      },
    },
  });
}
