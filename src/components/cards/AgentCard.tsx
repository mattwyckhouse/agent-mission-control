import { cn } from "@/lib/utils";
import { StatusBadge, type AgentStatus } from "@/components/ui/StatusBadge";
import type { Agent, UIAgentStatus } from "@/types";

interface AgentCardProps {
  agent: Agent;
  activity?: string;
  tokenCount?: number;
  onClick?: () => void;
  className?: string;
}

// Map database status to UI status for visual display
function mapStatusToUI(status: string): UIAgentStatus {
  switch (status) {
    case "online":
      return "active";
    case "busy":
      return "working";
    case "error":
      return "error";
    case "offline":
    default:
      return "offline";
  }
}

// Get status dot color classes
function getStatusDotClasses(status: UIAgentStatus): string {
  const base = "w-2.5 h-2.5 rounded-full flex-shrink-0";
  
  switch (status) {
    case "active":
      return cn(base, "bg-[#1BD0B8] shadow-[0_0_8px_rgba(27,208,184,0.6)]");
    case "working":
      return cn(base, "bg-[#F27229] animate-pulse shadow-[0_0_8px_rgba(242,114,41,0.6)]");
    case "error":
      return cn(base, "bg-[#DE5E57] animate-pulse shadow-[0_0_8px_rgba(222,94,87,0.6)]");
    case "idle":
      return cn(base, "bg-[#8E9296]");
    case "offline":
    default:
      return cn(base, "bg-[#4E5257]");
  }
}

// Format token count for display
function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M tokens`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K tokens`;
  }
  return `${count} tokens`;
}

// Calculate time since last heartbeat
function getLastSeenText(lastHeartbeat: string | null): string {
  if (!lastHeartbeat) {
    return "Never active";
  }
  
  const now = new Date();
  const last = new Date(lastHeartbeat);
  const diffMs = now.getTime() - last.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * AgentCard - Individual agent status display
 * 
 * Shows:
 * - Status dot with glow effect for active states
 * - Agent name with emoji
 * - Domain/specialty
 * - Status badge
 * - Current activity (if provided)
 * - Token count (if provided)
 * 
 * Features:
 * - Glass-morphism design
 * - Hover effects with teal border glow
 * - Click handler for drill-down
 */
export function AgentCard({
  agent,
  activity,
  tokenCount,
  onClick,
  className,
}: AgentCardProps) {
  const uiStatus = mapStatusToUI(agent.status);
  const statusDotClasses = getStatusDotClasses(uiStatus);
  const lastSeen = getLastSeenText(agent.last_heartbeat);
  
  // Generate activity text if not provided
  const displayActivity = activity || (
    agent.current_task_id 
      ? `Working on task` 
      : agent.status === "online" 
        ? "Standing by" 
        : `Last seen: ${lastSeen}`
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        "p-4 rounded-xl",
        "bg-[rgba(30,33,36,0.6)] backdrop-blur-md",
        "border border-[rgba(255,255,255,0.08)]",
        // Transitions
        "transition-all duration-200 ease-out",
        // Hover effects
        "hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "hover:border-[rgba(27,208,184,0.3)]",
        // Cursor
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header row: Status dot + Name */}
      <div className="flex items-center gap-2 mb-1">
        <span className={statusDotClasses} aria-hidden="true" />
        <span className="font-semibold text-base text-[#E8E9EA] truncate">
          {agent.emoji && <span className="mr-1.5">{agent.emoji}</span>}
          {agent.display_name}
        </span>
      </div>
      
      {/* Domain */}
      <p className="text-xs text-[#8E9296] mb-3 pl-4">
        {agent.domain}
      </p>
      
      {/* Status badge */}
      <div className="mb-2">
        <StatusBadge status={uiStatus as AgentStatus} size="sm" />
      </div>
      
      {/* Activity line */}
      <p className="text-xs text-[#9FA3A8] truncate mb-1">
        {displayActivity}
      </p>
      
      {/* Token count (if provided) */}
      {tokenCount !== undefined && tokenCount > 0 && (
        <p className="text-xs text-[#6B7075] tabular-nums">
          {formatTokenCount(tokenCount)}
        </p>
      )}
    </div>
  );
}

export default AgentCard;
