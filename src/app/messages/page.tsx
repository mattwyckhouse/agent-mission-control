/**
 * Messages Page — Inter-Agent Communication Log
 * 
 * Robust message viewer with DataTable, search, filtering, server-side pagination.
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/cards/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Activity,
  X,
} from "lucide-react";

// Types
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

interface Filters {
  search: string;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  dateRange: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

// Agent data
const AGENTS = [
  { id: "klaus", name: "Klaus", emoji: "🎯" },
  { id: "iris", name: "Iris", emoji: "📧" },
  { id: "atlas", name: "Atlas", emoji: "📅" },
  { id: "oracle", name: "Oracle", emoji: "🔮" },
  { id: "sentinel", name: "Sentinel", emoji: "📊" },
  { id: "herald", name: "Herald", emoji: "📢" },
  { id: "forge", name: "Forge", emoji: "🔨" },
  { id: "aegis", name: "Aegis", emoji: "🛡️" },
  { id: "codex", name: "Codex", emoji: "📚" },
  { id: "pixel", name: "Pixel", emoji: "🎨" },
  { id: "pathfinder", name: "Pathfinder", emoji: "🧭" },
  { id: "curator", name: "Curator", emoji: "🎁" },
  { id: "steward", name: "Steward", emoji: "🏠" },
];

const MESSAGE_TYPES = [
  { value: "session_send", label: "Session Send" },
  { value: "escalation", label: "Escalation" },
  { value: "report", label: "Report" },
  { value: "task_update", label: "Task Update" },
];

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Helpers
function getAgentDisplay(agentId: string | null, isHuman: boolean, metadata?: Record<string, unknown>) {
  if (isHuman) return { name: "Matt", emoji: "👤" };
  
  const input = metadata?.from_input || metadata?.to_input;
  if (typeof input === "string") {
    const agent = AGENTS.find(a => a.id === input.toLowerCase());
    if (agent) return agent;
  }
  
  if (!agentId) return { name: "Unknown", emoji: "❓" };
  
  const agent = AGENTS.find(a => a.id === agentId);
  return agent || { name: agentId.slice(0, 8), emoji: "🤖" };
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

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatDateTime(isoString: string) {
  return `${formatDate(isoString)} at ${formatTime(isoString)}`;
}

function getDateRangeFilter(range: string): string | undefined {
  const now = new Date();
  switch (range) {
    case "today":
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    case "week":
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case "month":
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    default:
      return undefined;
  }
}

// Components
function MessageTypeTag({ type }: { type: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    session_send: "secondary",
    escalation: "destructive",
    report: "default",
    task_update: "outline",
  };
  
  return (
    <Badge variant={variants[type] || "secondary"} className="text-xs">
      {type.replace("_", " ")}
    </Badge>
  );
}

function AgentBadge({ agentId, isHuman, metadata }: { agentId: string | null; isHuman: boolean; metadata?: Record<string, unknown> }) {
  const agent = getAgentDisplay(agentId, isHuman, metadata);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{agent.emoji}</span>
      <span className="font-medium">{agent.name}</span>
    </span>
  );
}

function StatsCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
    </div>
  );
}

function ExpandedMessageRow({ message }: { message: Message }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={6} className="p-4">
        <div className="space-y-3">
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>ID: {message.id.slice(0, 8)}...</span>
            {message.task_id && <span>Task: {message.task_id.slice(0, 8)}...</span>}
            {message.thread_id && <span>Thread: {message.thread_id.slice(0, 8)}...</span>}
            <span>Logged: {formatDateTime(message.created_at)}</span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}

function PaginationControls({ pagination, onPageChange, onPageSizeChange, loading }: PaginationControlsProps) {
  const { page, pageSize, totalCount } = pagination;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[70px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(size => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        {totalCount === 0 ? (
          "No messages"
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{startItem}</span>
            {" - "}
            <span className="font-medium text-foreground">{endItem}</span>
            {" of "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </>
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm text-muted-foreground">Page</span>
          <Input
            type="number"
            min={1}
            max={totalPages || 1}
            value={page}
            onChange={(e) => {
              const newPage = parseInt(e.target.value);
              if (newPage >= 1 && newPage <= totalPages) {
                onPageChange(newPage);
              }
            }}
            className="w-14 h-8 text-center"
          />
          <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Main page
export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "timeline">("table");
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalCount: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: "",
    fromAgent: "all",
    toAgent: "all",
    messageType: "all",
    dateRange: "all",
  });

  // Fetch messages with server-side pagination
  const fetchMessages = useCallback(async (pageOverride?: number) => {
    try {
      const currentPage = pageOverride ?? pagination.page;
      const offset = (currentPage - 1) * pagination.pageSize;
      
      const params = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (filters.fromAgent !== "all") {
        params.set("from_agent", filters.fromAgent);
      }
      if (filters.toAgent !== "all") {
        params.set("to_agent", filters.toAgent);
      }
      if (filters.messageType !== "all") {
        params.set("message_type", filters.messageType);
      }
      
      const since = getDateRangeFilter(filters.dateRange);
      if (since) {
        params.set("since", since);
      }

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      
      setMessages(json.messages || []);
      setPagination(prev => ({
        ...prev,
        page: currentPage,
        totalCount: json.count || 0,
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.pageSize, filters.fromAgent, filters.toAgent, filters.messageType, filters.dateRange]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(), 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.fromAgent, filters.toAgent, filters.messageType, filters.dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    fetchMessages(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fromAgent: "all",
      toAgent: "all",
      messageType: "all",
      dateRange: "all",
    });
  };

  const hasActiveFilters = filters.search || 
    filters.fromAgent !== "all" || 
    filters.toAgent !== "all" || 
    filters.messageType !== "all" || 
    filters.dateRange !== "all";

  // Client-side search filter (search is still client-side for responsiveness)
  const filteredMessages = useMemo(() => {
    if (!filters.search) return messages;
    
    const searchLower = filters.search.toLowerCase();
    return messages.filter(m => {
      const contentMatch = m.content.toLowerCase().includes(searchLower);
      const fromMatch = getAgentDisplay(m.from_agent_id, m.from_human, m.metadata).name.toLowerCase().includes(searchLower);
      const toMatch = getAgentDisplay(m.to_agent_id, m.to_human, m.metadata).name.toLowerCase().includes(searchLower);
      return contentMatch || fromMatch || toMatch;
    });
  }, [messages, filters.search]);

  // Stats (based on current page for now)
  const stats = useMemo(() => {
    const uniqueSenders = new Set(messages.map(m => m.from_agent_id || "human").filter(Boolean));
    const uniqueReceivers = new Set(messages.map(m => m.to_agent_id || "human").filter(Boolean));
    const taskRelated = messages.filter(m => m.task_id).length;
    const escalations = messages.filter(m => m.message_type === "escalation").length;
    
    return {
      total: pagination.totalCount,
      participants: uniqueSenders.size + uniqueReceivers.size,
      taskRelated,
      escalations,
    };
  }, [messages, pagination.totalCount]);

  // Group by date for timeline view
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    filteredMessages.forEach(m => {
      const date = formatDate(m.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  }, [filteredMessages]);

  return (
    <AppShell>
      <PageHeader
        title="Agent Messages"
        subtitle={`${pagination.totalCount} total messages${hasActiveFilters ? " (filtered)" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Messages" value={stats.total} icon={MessageSquare} />
        <StatsCard title="Participants" value={stats.participants} icon={Users} />
        <StatsCard title="Task Related" value={stats.taskRelated} icon={Activity} />
        <StatsCard title="Escalations" value={stats.escalations} icon={Clock} />
      </div>

      {/* Filters */}
      <GlassCard className="mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages, agents..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.fromAgent}
              onValueChange={(v) => setFilters(f => ({ ...f, fromAgent: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="From Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Senders</SelectItem>
                {AGENTS.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.toAgent}
              onValueChange={(v) => setFilters(f => ({ ...f, toAgent: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="To Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                {AGENTS.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.messageType}
              onValueChange={(v) => setFilters(f => ({ ...f, messageType: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {MESSAGE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(v) => setFilters(f => ({ ...f, dateRange: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "table" | "timeline")} className="mb-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {loading && messages.length === 0 ? (
        <GlassCard className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </GlassCard>
      ) : error ? (
        <GlassCard className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">Retry</Button>
        </GlassCard>
      ) : filteredMessages.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {hasActiveFilters ? "No Matching Messages" : "No Messages Yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {hasActiveFilters 
              ? "Try adjusting your filters to see more messages."
              : "Inter-agent messages will appear here when agents communicate."}
          </p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </GlassCard>
      ) : view === "table" ? (
        /* Table View */
        <GlassCard className="p-0 overflow-hidden">
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="max-w-[400px]">Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <>
                      <TableRow
                        key={message.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(message.id)}
                      >
                        <TableCell>
                          {expandedRows.has(message.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <AgentBadge 
                            agentId={message.from_agent_id} 
                            isHuman={message.from_human}
                            metadata={message.metadata}
                          />
                        </TableCell>
                        <TableCell>
                          <AgentBadge 
                            agentId={message.to_agent_id} 
                            isHuman={message.to_human}
                            metadata={message.metadata}
                          />
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <p className="truncate text-sm text-foreground">
                            {message.content.slice(0, 100)}
                            {message.content.length > 100 && "..."}
                          </p>
                        </TableCell>
                        <TableCell>
                          <MessageTypeTag type={message.message_type} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(message.created_at)}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(message.id) && (
                        <ExpandedMessageRow key={`${message.id}-expanded`} message={message} />
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          {/* Pagination Controls */}
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </GlassCard>
      ) : (
        /* Timeline View */
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
              <GlassCard className="space-y-3 p-3">
                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => toggleRow(message.id)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {getAgentDisplay(message.from_agent_id, message.from_human, message.metadata).emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 text-sm">
                        <AgentBadge 
                          agentId={message.from_agent_id} 
                          isHuman={message.from_human}
                          metadata={message.metadata}
                        />
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <AgentBadge 
                          agentId={message.to_agent_id} 
                          isHuman={message.to_human}
                          metadata={message.metadata}
                        />
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm text-foreground/90 ${expandedRows.has(message.id) ? "whitespace-pre-wrap" : "truncate"}`}>
                        {expandedRows.has(message.id) ? message.content : message.content.slice(0, 150)}
                        {!expandedRows.has(message.id) && message.content.length > 150 && "..."}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <MessageTypeTag type={message.message_type} />
                        {message.task_id && (
                          <Badge variant="outline" className="text-xs">
                            Task linked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </GlassCard>
            </div>
          ))}
          
          {/* Pagination for Timeline too */}
          <GlassCard className="p-0">
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}
