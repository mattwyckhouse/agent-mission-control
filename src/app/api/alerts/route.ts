/**
 * Alerts API — Cost and Usage Alerts
 * 
 * GET /api/alerts — List alerts
 * POST /api/alerts — Trigger a new alert
 * 
 * Alert types:
 * - budget_exceeded — Daily/weekly/monthly budget crossed
 * - usage_spike — Unusual usage pattern
 * - agent_inactive — Agent not seen recently
 * - custom — Manual/webhook-triggered alert
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AlertType = "budget_exceeded" | "usage_spike" | "agent_inactive" | "custom";
type AlertSeverity = "info" | "warning" | "critical";

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  agent_id?: string;
  threshold?: number;
  current_value?: number;
  acknowledged: boolean;
  acknowledged_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// GET — List alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const unacknowledgedOnly = searchParams.get("unacknowledged") === "true";
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const since = searchParams.get("since");

    const supabase = await createClient();

    // Query messages table with message_type = 'escalation' for alerts
    // Or we can use metadata to filter alert-specific messages
    let query = supabase
      .from("messages")
      .select("*", { count: "exact" })
      .eq("message_type", "escalation")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gte("created_at", since);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching alerts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform messages to alert format
    interface MessageRecord {
      id: string;
      content: string;
      from_agent_id: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }
    const messages = (data || []) as MessageRecord[];
    const alerts: Alert[] = messages.map(msg => {
      const metadata = msg.metadata || {};
      return {
        id: msg.id,
        type: (metadata.alert_type as AlertType) || "custom",
        severity: (metadata.severity as AlertSeverity) || "warning",
        title: (metadata.title as string) || "Alert",
        message: msg.content,
        agent_id: msg.from_agent_id || undefined,
        threshold: metadata.threshold as number | undefined,
        current_value: metadata.current_value as number | undefined,
        acknowledged: metadata.acknowledged === true,
        acknowledged_at: metadata.acknowledged_at as string | undefined,
        metadata: metadata,
        created_at: msg.created_at,
      };
    });

    // Apply filters
    let filtered = alerts;
    if (unacknowledgedOnly) {
      filtered = filtered.filter(a => !a.acknowledged);
    }
    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }
    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    return NextResponse.json({
      alerts: filtered,
      count: count || 0,
      unacknowledged: filtered.filter(a => !a.acknowledged).length,
    });
  } catch (err) {
    console.error("Alerts API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create/trigger a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = "custom",
      severity = "warning",
      title,
      message,
      agent_id,
      threshold,
      current_value,
      metadata = {},
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store alert as an escalation message
    const alertData = {
      from_agent_id: agent_id || null,
      to_agent_id: null,
      from_human: false,
      to_human: true, // Alerts go to the human
      content: message,
      message_type: "escalation",
      metadata: {
        alert_type: type,
        severity,
        title,
        threshold,
        current_value,
        acknowledged: false,
        ...metadata,
      },
    };

    const { data: insertedRaw, error } = await supabase
      .from("messages")
      .insert(alertData as never)
      .select()
      .single();

    if (error) {
      console.error("Error creating alert:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inserted = insertedRaw as { id: string; created_at: string };

    return NextResponse.json({
      success: true,
      alert: {
        id: inserted.id,
        type,
        severity,
        title,
        message,
        agent_id,
        threshold,
        current_value,
        created_at: inserted.created_at,
      },
    });
  } catch (err) {
    console.error("Alerts API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Acknowledge an alert
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_id, acknowledged = true } = body;

    if (!alert_id) {
      return NextResponse.json(
        { error: "alert_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current message
    const { data: currentRaw, error: fetchError } = await supabase
      .from("messages")
      .select("metadata")
      .eq("id", alert_id)
      .single();

    if (fetchError || !currentRaw) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const current = currentRaw as { metadata: Record<string, unknown> | null };

    // Update metadata with acknowledged status
    const currentMetadata = current.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      acknowledged,
      acknowledged_at: acknowledged ? new Date().toISOString() : null,
    };

    const { error: updateError } = await supabase
      .from("messages")
      .update({ metadata: updatedMetadata } as never)
      .eq("id", alert_id);

    if (updateError) {
      console.error("Error acknowledging alert:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alert_id,
      acknowledged,
    });
  } catch (err) {
    console.error("Alerts API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
