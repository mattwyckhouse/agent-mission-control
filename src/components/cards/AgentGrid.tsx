import { cn } from "@/lib/utils";
import { AgentCard } from "./AgentCard";
import type { Agent } from "@/types";

interface AgentGridProps {
  agents: Agent[];
  tokensByAgent?: Record<string, number>;
  onAgentClick?: (agent: Agent) => void;
  className?: string;
}

/**
 * AgentGrid - Responsive grid layout for AgentCards
 * 
 * Features:
 * - Auto-fill grid that adapts to container width
 * - Minimum card width of 180px
 * - 3 columns fixed on large screens (1024px+)
 * - Consistent spacing using design system tokens
 * 
 * Layout:
 * - Mobile: 1-2 columns (auto-fill based on width)
 * - Tablet: 2-3 columns (auto-fill)
 * - Desktop: 3 fixed columns
 */
export function AgentGrid({
  agents,
  tokensByAgent = {},
  onAgentClick,
  className,
}: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div
        className={cn(
          "p-8 text-center rounded-xl",
          "bg-card/40",
          "border border-border",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">No agents found</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Base grid layout
        "grid gap-3",
        // Auto-fill with minimum 180px cards
        "grid-cols-[repeat(auto-fill,minmax(180px,1fr))]",
        // Fixed 3 columns on large screens
        "lg:grid-cols-3",
        className
      )}
    >
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          tokenCount={tokensByAgent[agent.id]}
          onClick={onAgentClick ? () => onAgentClick(agent) : undefined}
        />
      ))}
    </div>
  );
}

export default AgentGrid;
