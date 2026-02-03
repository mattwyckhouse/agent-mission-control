"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/cards/GlassCard";
import { 
  Play, 
  Square, 
  RotateCcw, 
  MessageSquare, 
  Heart,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentActionType, ActionResult } from "@/types/actions";

interface AgentControlPanelProps {
  agentId: string;
  agentName: string;
  agentStatus: string;
  className?: string;
  onActionComplete?: (result: ActionResult) => void;
}

interface ActionState {
  type: AgentActionType | null;
  loading: boolean;
  result: ActionResult | null;
  error: string | null;
}

/**
 * AgentControlPanel - Control buttons for agent actions
 * 
 * Features:
 * - Start/Stop/Restart buttons
 * - Send message input
 * - Trigger heartbeat
 * - Action status feedback
 */
export function AgentControlPanel({
  agentId,
  agentName,
  agentStatus,
  className,
  onActionComplete,
}: AgentControlPanelProps) {
  const [actionState, setActionState] = useState<ActionState>({
    type: null,
    loading: false,
    result: null,
    error: null,
  });
  const [message, setMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);

  const executeAction = useCallback(async (
    type: AgentActionType,
    messageContent?: string
  ) => {
    setActionState({
      type,
      loading: true,
      result: null,
      error: null,
    });

    try {
      const response = await fetch(`/api/agents/${agentId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: messageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Action failed: ${response.status}`);
      }

      setActionState({
        type,
        loading: false,
        result: data.result,
        error: null,
      });

      onActionComplete?.(data.result);

      // Clear message input after successful send
      if (type === "message") {
        setMessage("");
        setShowMessageInput(false);
      }

      // Auto-clear success state after 3 seconds
      setTimeout(() => {
        setActionState((prev) => 
          prev.result?.id === data.result.id
            ? { type: null, loading: false, result: null, error: null }
            : prev
        );
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Action failed";
      setActionState({
        type,
        loading: false,
        result: null,
        error: errorMessage,
      });
    }
  }, [agentId, onActionComplete]);

  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      executeAction("message", message.trim());
    }
  }, [message, executeAction]);

  const isOnline = agentStatus === "online" || agentStatus === "busy";
  const isLoading = (type: AgentActionType) => 
    actionState.loading && actionState.type === type;

  return (
    <GlassCard variant="glass-1" padding="md" className={className}>
      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">
        Agent Controls
      </h3>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Start */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => executeAction("start")}
          disabled={actionState.loading || isOnline}
          className="flex items-center gap-2"
        >
          {isLoading("start") ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Start
        </Button>

        {/* Stop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeAction("stop")}
          disabled={actionState.loading || !isOnline}
          className="flex items-center gap-2"
        >
          {isLoading("stop") ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Stop
        </Button>

        {/* Restart */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeAction("restart")}
          disabled={actionState.loading}
          className="flex items-center gap-2"
        >
          {isLoading("restart") ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Restart
        </Button>

        {/* Heartbeat */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => executeAction("heartbeat")}
          disabled={actionState.loading}
          className="flex items-center gap-2"
        >
          {isLoading("heartbeat") ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
          Heartbeat
        </Button>

        {/* Message Toggle */}
        <Button
          variant={showMessageInput ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowMessageInput(!showMessageInput)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </Button>
      </div>

      {/* Message Input */}
      {showMessageInput && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={`Send message to ${agentName}...`}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm",
              "bg-background border border-border",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            )}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSendMessage}
            disabled={!message.trim() || actionState.loading}
          >
            {isLoading("message") ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Action Result */}
      {(actionState.result || actionState.error) && (
        <div className={cn(
          "flex items-start gap-2 p-3 rounded-lg text-sm",
          actionState.error 
            ? "bg-error/10 text-error" 
            : "bg-success/10 text-success"
        )}>
          {actionState.error ? (
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>
            {actionState.error || actionState.result?.message}
          </span>
        </div>
      )}
    </GlassCard>
  );
}

export default AgentControlPanel;
