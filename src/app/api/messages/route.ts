/**
 * Messages API — Inter-Agent Communication Log
 * 
 * POST /api/messages — Log a new message
 * GET /api/messages — Fetch message history (with filters)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper to resolve agent name to UUID
async function resolveAgentId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agentIdOrName: string | null
): Promise<string | null> {
  if (!agentIdOrName) return null;
  
  // If it looks like a UUID, return as-is
  if (agentIdOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return agentIdOrName;
  }
  
  // Try to look up by name
  const { data } = await supabase
    .from("agents")
    .select("id")
    .eq("name", agentIdOrName.toLowerCase())
    .single();
  
  // Type assertion since Supabase types may not be complete
  return (data as { id: string } | null)?.id || null;
}

// POST — Log a new inter-agent message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      from_agent_id: fromAgentInput,
      to_agent_id: toAgentInput,
      from_agent, // Alternative: agent name
      to_agent,   // Alternative: agent name
      from_human = false,
      to_human = false,
      content,
      message_type = "session_send",
      task_id = null,
      thread_id = null,
      metadata = {},
    } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const fromInput = fromAgentInput || from_agent;
    const toInput = toAgentInput || to_agent;

    if (!fromInput && !from_human) {
      return NextResponse.json(
        { error: "from_agent_id, from_agent, or from_human is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Resolve agent names to UUIDs if needed
    const from_agent_id = await resolveAgentId(supabase, fromInput);
    const to_agent_id = await resolveAgentId(supabase, toInput);

    // Use explicit typing since Supabase types may not be fully generated
    const messageData = {
      from_agent_id,
      to_agent_id,
      from_human,
      to_human,
      content,
      message_type,
      task_id,
      thread_id,
      metadata: {
        ...metadata,
        from_input: fromInput, // Store original input for reference
        to_input: toInput,
        logged_at: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(messageData as never)
      .select()
      .single();

    if (error) {
      console.error("Error inserting message:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: data });
  } catch (err) {
    console.error("Messages API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — Fetch message history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const from_agent_param = searchParams.get("from_agent");
    const to_agent_param = searchParams.get("to_agent");
    const agent_param = searchParams.get("agent"); // Either from or to
    const task_id = searchParams.get("task_id");
    const thread_id = searchParams.get("thread_id");
    const since = searchParams.get("since"); // ISO timestamp

    const supabase = await createClient();

    // Resolve agent names to UUIDs
    const from_agent = await resolveAgentId(supabase, from_agent_param);
    const to_agent = await resolveAgentId(supabase, to_agent_param);
    const agent = await resolveAgentId(supabase, agent_param);

    let query = supabase
      .from("messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters (only if resolved successfully or was already a UUID)
    if (from_agent_param && from_agent) {
      query = query.eq("from_agent_id", from_agent);
    }
    
    if (to_agent_param && to_agent) {
      query = query.eq("to_agent_id", to_agent);
    }
    
    if (agent_param && agent) {
      query = query.or(`from_agent_id.eq.${agent},to_agent_id.eq.${agent}`);
    }
    
    if (task_id) {
      query = query.eq("task_id", task_id);
    }
    
    if (thread_id) {
      query = query.eq("thread_id", thread_id);
    }
    
    if (since) {
      query = query.gte("created_at", since);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Messages API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
