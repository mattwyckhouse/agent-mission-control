"use client";

import { useRouter } from "next/navigation";
import { AgentGrid } from "./AgentGrid";
import type { Agent } from "@/types";

interface ClientAgentGridProps {
  agents: Agent[];
  tokensByAgent?: Record<string, number>;
  className?: string;
}

/**
 * ClientAgentGrid - Client wrapper for AgentGrid with navigation
 * 
 * Wraps the server-compatible AgentGrid component and adds
 * click handling to navigate to agent detail pages.
 */
export function ClientAgentGrid({
  agents,
  tokensByAgent,
  className,
}: ClientAgentGridProps) {
  const router = useRouter();

  const handleAgentClick = (agent: Agent) => {
    router.push(`/agent/${agent.id}`);
  };

  return (
    <AgentGrid
      agents={agents}
      tokensByAgent={tokensByAgent}
      onAgentClick={handleAgentClick}
      className={className}
    />
  );
}

export default ClientAgentGrid;
