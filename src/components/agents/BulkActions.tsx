"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Heart,
  Loader2,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentActionType, BulkActionResponse } from "@/types/actions";

interface BulkActionsProps {
  /** Selected agent IDs */
  selectedAgentIds: string[];
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Callback after bulk action completes */
  onActionComplete?: (response: BulkActionResponse) => void;
  /** Additional class names */
  className?: string;
}

interface BulkActionState {
  loading: boolean;
  type: AgentActionType | null;
  progress: {
    completed: number;
    total: number;
  };
  confirmDialog: {
    isOpen: boolean;
    type: AgentActionType | null;
  };
}

/**
 * BulkActions - Perform actions on multiple agents at once
 * 
 * Features:
 * - Select multiple agents
 * - Apply action to all selected
 * - Progress indicator during bulk ops
 * - Confirmation for destructive actions
 */
export function BulkActions({
  selectedAgentIds,
  onClearSelection,
  onActionComplete,
  className,
}: BulkActionsProps) {
  const [state, setState] = useState<BulkActionState>({
    loading: false,
    type: null,
    progress: { completed: 0, total: 0 },
    confirmDialog: { isOpen: false, type: null },
  });

  const count = selectedAgentIds.length;
  const hasSelection = count > 0;

  // Execute bulk action
  const executeBulkAction = useCallback(async (type: AgentActionType) => {
    if (!hasSelection) return;

    setState(prev => ({
      ...prev,
      loading: true,
      type,
      progress: { completed: 0, total: count },
      confirmDialog: { isOpen: false, type: null },
    }));

    const results: Record<string, any> = {};
    let completed = 0;
    let failed = 0;

    // Execute actions sequentially to avoid rate limiting
    for (const agentId of selectedAgentIds) {
      try {
        const response = await fetch(`/api/agents/${agentId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        const data = await response.json();
        results[agentId] = data.result || { status: "failed", error: data.error };
        
        if (data.success) {
          completed++;
        } else {
          failed++;
        }
      } catch (error) {
        results[agentId] = {
          status: "failed",
          error: { message: error instanceof Error ? error.message : "Unknown error" },
        };
        failed++;
      }

      setState(prev => ({
        ...prev,
        progress: { completed: prev.progress.completed + 1, total: count },
      }));
    }

    setState(prev => ({
      ...prev,
      loading: false,
      type: null,
    }));

    const response: BulkActionResponse = {
      success: failed === 0,
      results,
      summary: {
        total: count,
        completed,
        failed,
      },
    };

    onActionComplete?.(response);
    
    // Clear selection after successful bulk action
    if (failed === 0) {
      onClearSelection();
    }
  }, [hasSelection, count, selectedAgentIds, onActionComplete, onClearSelection]);

  // Request confirmation for destructive actions
  const requestConfirmation = useCallback((type: AgentActionType) => {
    if (type === "stop" || type === "restart") {
      setState(prev => ({
        ...prev,
        confirmDialog: { isOpen: true, type },
      }));
    } else {
      executeBulkAction(type);
    }
  }, [executeBulkAction]);

  const closeConfirmDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      confirmDialog: { isOpen: false, type: null },
    }));
  }, []);

  const confirmAction = useCallback(() => {
    if (state.confirmDialog.type) {
      executeBulkAction(state.confirmDialog.type);
    }
  }, [state.confirmDialog.type, executeBulkAction]);

  if (!hasSelection) {
    return null;
  }

  const progressPercent = state.loading 
    ? Math.round((state.progress.completed / state.progress.total) * 100)
    : 0;

  return (
    <>
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-brand-teal/10 border border-brand-teal/30",
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}>
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-brand-teal" />
          <span className="text-sm font-medium text-foreground">
            {count} agent{count !== 1 ? "s" : ""} selected
          </span>
        </div>

        {/* Progress indicator (when loading) */}
        {state.loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/20">
            <Loader2 className="w-4 h-4 text-brand-teal animate-spin" />
            <span className="text-xs text-brand-teal font-medium">
              {state.progress.completed}/{state.progress.total} ({progressPercent}%)
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => requestConfirmation("start")}
            disabled={state.loading}
            className="text-success hover:text-success"
          >
            <Play className="w-4 h-4 mr-1" />
            Start All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => requestConfirmation("stop")}
            disabled={state.loading}
            className="text-error hover:text-error"
          >
            <Square className="w-4 h-4 mr-1" />
            Stop All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => requestConfirmation("restart")}
            disabled={state.loading}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => requestConfirmation("heartbeat")}
            disabled={state.loading}
          >
            <Heart className="w-4 h-4 mr-1" />
            Heartbeat All
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={state.loading}
          >
            <XSquare className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={state.confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
        title={`${state.confirmDialog.type === "stop" ? "Stop" : "Restart"} ${count} Agent${count !== 1 ? "s" : ""}?`}
        message={`This will ${state.confirmDialog.type} ${count} selected agent${count !== 1 ? "s" : ""}. Are you sure you want to continue?`}
        confirmText={`Yes, ${state.confirmDialog.type} All`}
        variant="danger"
        loading={state.loading}
      />
    </>
  );
}

export default BulkActions;
