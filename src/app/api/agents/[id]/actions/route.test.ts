import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
  insert: vi.fn(() => ({ error: null })),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Import after mocks
import { POST, GET } from "./route";

describe("Agent Actions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: agent exists
    mockSupabase.single.mockResolvedValue({
      data: { id: "forge", name: "Forge", status: "online" },
      error: null,
    });
  });

  describe("POST /api/agents/[id]/actions", () => {
    it("returns 400 for invalid action type", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "invalid" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid action type");
    });

    it("returns 400 for message action without message", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "message" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Message is required");
    });

    it("returns 404 for non-existent agent", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const request = new NextRequest("http://localhost/api/agents/unknown/actions", {
        method: "POST",
        body: JSON.stringify({ type: "start" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "unknown" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("Agent not found");
    });

    it("successfully executes start action", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "start" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.status).toBe("completed");
      expect(data.result.action.type).toBe("start");
    });

    it("successfully executes stop action", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "stop" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.action.type).toBe("stop");
    });

    it("successfully executes restart action", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "restart" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.action.type).toBe("restart");
    });

    it("successfully executes message action with content", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "message", message: "Hello Forge!" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.action.type).toBe("message");
      expect(data.result.output).toBe("Hello Forge!");
    });

    it("successfully executes heartbeat action", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "heartbeat" }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.action.type).toBe("heartbeat");
    });

    it("logs action to activities table", async () => {
      const request = new NextRequest("http://localhost/api/agents/forge/actions", {
        method: "POST",
        body: JSON.stringify({ type: "start" }),
      });

      await POST(request, { params: Promise.resolve({ id: "forge" }) });

      // Verify insert was called for activities
      expect(mockSupabase.from).toHaveBeenCalledWith("activities");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("GET /api/agents/[id]/actions", () => {
    it("returns action history for agent", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          {
            id: "act-1",
            activity_type: "agent_action",
            description: "Agent started",
            agent_id: "forge",
            created_at: "2026-02-03T04:00:00Z",
            metadata: { actionId: "action-1", actionType: "start", status: "completed" },
          },
        ],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/agents/forge/actions");
      const response = await GET(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(1);
      expect(data.history[0].type).toBe("start");
    });

    it("respects limit parameter", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/agents/forge/actions?limit=5");
      await GET(request, { params: Promise.resolve({ id: "forge" }) });

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it("handles database errors", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const request = new NextRequest("http://localhost/api/agents/forge/actions");
      const response = await GET(request, { params: Promise.resolve({ id: "forge" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });
  });
});
