/**
 * Messages Page — Inter-Agent Communication Log
 * 
 * Displays real-time message flow between agents.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/cards/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, 
  MessageSquare, 
  ArrowRight, 
  User, 
  Bot,
  Filter,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  from_human: boolean;
  to_human: boolean;
  content: string;
  message_type: string;
  task_id: string | null;
  thread_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const AGENT_NAMES: Record<string, { name: string; emoji: string }> = {
  klaus: { name: "Klaus", emoji: "🎯" },
  iris: { name: "Iris", emoji: "📧" },
  atlas: { name: "Atlas", emoji: "📅" },
  oracle: { name: "Oracle", emoji: "🔮" },
  sentinel: { name: "Sentinel", emoji: "📊" },
  herald: { name: "Herald", emoji: "📢" },
  forge: { name: "Forge", emoji: "🔨" },
  aegis: { name: "Aegis", emoji: "🛡️" },
  codex: { name: "Codex", emoji: "📚" },
  pixel: { name: "Pixel", emoji: "🎨" },
  pathfinder: { name: "Pathfinder", emoji: "🧭" },
  curator: { name: "Curator", emoji: "🎁" },
  steward: { name: "Steward", emoji: "🏠" },
};

function getAgentDisplay(agentId: string | null, isHuman: boolean) {
  if (isHuman) {
    return { name: "Matt", emoji: "👤" };
  }
  if (!agentId) {
    return { name: "Unknown", emoji: "❓" };
  }
  return AGENT_NAMES[agentId] || { name: agentId, emoji: "🤖" };
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function MessageCard({ message }: { message: Message }) {
  const from = getAgentDisplay(message.from_agent_id, message.from_human);
  const to = getAgentDisplay(message.to_agent_id, message.to_human);

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      {/* From */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
        {from.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 text-sm">
          <span className="font-semibold text-foreground">{from.name}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{to.name}</span>
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Message body */}
        <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {message.content.length > 500
            ? message.content.slice(0, 500) + "..."
            : message.content}
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
            {message.message_type}
          </span>
          {message.task_id && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-brand-teal/20 text-brand-teal">
              Task: {message.task_id.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [agentFilter, setAgentFilter] = useState<string>("");

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (agentFilter) {
        params.set("agent", agentFilter);
      }

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setMessages(json.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentFilter]);

  useEffect(() => {
    fetchMessages();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <AppShell>
      <PageHeader
        title="Agent Messages"
        subtitle="Inter-agent communication log"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-card border border-border text-sm text-foreground"
            >
              <option value="">All Agents</option>
              {Object.entries(AGENT_NAMES).map(([id, { name, emoji }]) => (
                <option key={id} value={id}>
                  {emoji} {name}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {loading ? (
        <GlassCard className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </GlassCard>
      ) : error ? (
        <GlassCard className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-error" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </GlassCard>
      ) : messages.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Messages Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Inter-agent messages will appear here when agents communicate via
            sessions_send. Enable agent-side logging to start capturing messages.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {date}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <GlassCard className="space-y-2 p-2">
                {dateMessages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </GlassCard>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {messages.length > 0 && (
        <GlassCard className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {messages.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Messages
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {new Set(messages.map((m) => m.from_agent_id).filter(Boolean)).size}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Senders
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {messages.filter((m) => m.task_id).length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Task-Related
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {messages.filter((m) => m.from_human || m.to_human).length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Human Involved
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </AppShell>
  );
}
