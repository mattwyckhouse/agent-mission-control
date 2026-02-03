/**
 * Messages API — Inter-Agent Communication Log
 * 
 * POST /api/messages — Log a new message
 * GET /api/messages — Fetch message history (with filters)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — Log a new inter-agent message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      from_agent_id,
      to_agent_id,
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

    if (!from_agent_id && !from_human) {
      return NextResponse.json(
        { error: "from_agent_id or from_human is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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
    const from_agent = searchParams.get("from_agent");
    const to_agent = searchParams.get("to_agent");
    const agent = searchParams.get("agent"); // Either from or to
    const task_id = searchParams.get("task_id");
    const thread_id = searchParams.get("thread_id");
    const since = searchParams.get("since"); // ISO timestamp

    const supabase = await createClient();

    let query = supabase
      .from("messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (from_agent) {
      query = query.eq("from_agent_id", from_agent);
    }
    
    if (to_agent) {
      query = query.eq("to_agent_id", to_agent);
    }
    
    if (agent) {
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
