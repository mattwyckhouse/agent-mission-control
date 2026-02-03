"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/cards/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  DollarSign,
  ChevronRight,
  User,
  FileCode
} from "lucide-react";
import type { RalphLoop } from "@/types";

interface LoopCardProps {
  loop: RalphLoop;
  className?: string;
  onClick?: () => void;
}

function formatDuration(startMs: number, endMs: number): string {
  const diffMs = endMs - startMs;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${minutes}m`;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "--";
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function formatCost(cost: number): string {
  return "$" + cost.toFixed(2);
}

export function LoopCard({ loop, className, onClick }: LoopCardProps) {
  const isComplete = loop.phase === "done";
  const isBlocked = loop.phase === "blocked";
  const progress = loop.totalSteps > 0 
    ? Math.round((loop.currentStep / loop.totalSteps) * 100) 
    : 0;
  
  const startTime = new Date(loop.startedAt).getTime();
  const endTime = new Date(loop.lastUpdate).getTime();
  const duration = formatDuration(startTime, endTime);

  return (
    <GlassCard
      className={cn(
        "group",
        onClick && "cursor-pointer",
        className
      )}
      hover={!!onClick}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isComplete && (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            )}
            {isBlocked && (
              <XCircle className="w-5 h-5 text-error flex-shrink-0" />
            )}
            <h3 className="text-base font-heading font-semibold text-text-primary truncate">
              {loop.name}
            </h3>
          </div>
          <p className="text-xs text-text-muted">
            Build ID: {loop.buildId}
          </p>
        </div>
        
        <StatusBadge 
          status={isComplete ? "success" : isBlocked ? "error" : "working"} 
        />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-secondary">Progress</span>
          <span className="text-text-primary font-medium">
            {loop.currentStep}/{loop.totalSteps} steps ({progress}%)
          </span>
        </div>
        <ProgressBar 
          value={progress}
          size="sm"
          showLabel={false}
          variant={isBlocked ? "warning" : "default"}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Agent */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="text-text-secondary">Agent:</span>
          <span className="font-medium text-text-primary truncate">
            {loop.agent}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="text-text-secondary">Time:</span>
          <span className="font-medium text-text-primary">
            {duration}
          </span>
        </div>

        {/* Tokens */}
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-brand-orange flex-shrink-0" />
          <span className="text-text-secondary">Tokens:</span>
          <span className="font-medium text-text-primary">
            {formatNumber(loop.tokensUsed)}
          </span>
        </div>

        {/* Cost */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-success flex-shrink-0" />
          <span className="text-text-secondary">Cost:</span>
          <span className="font-medium text-text-primary">
            {formatCost(loop.cost)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="text-xs text-text-muted">
          {formatDate(loop.startedAt)} at {formatTime(loop.startedAt)}
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-teal transition-colors" />
        )}
      </div>
    </GlassCard>
  );
}

/**
 * Compact variant for list views
 */
export function LoopCardCompact({ loop, className, onClick }: LoopCardProps) {
  const isComplete = loop.phase === "done";
  const isBlocked = loop.phase === "blocked";
  const progress = loop.totalSteps > 0 
    ? Math.round((loop.currentStep / loop.totalSteps) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg",
        "bg-glass-1 border border-white/10",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:border-brand-teal/50 hover:bg-glass-2",
        className
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isComplete && (
          <CheckCircle2 className="w-5 h-5 text-success" />
        )}
        {isBlocked && (
          <XCircle className="w-5 h-5 text-error" />
        )}
        {!isComplete && !isBlocked && (
          <FileCode className="w-5 h-5 text-brand-orange" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-semibold text-text-primary truncate">
            {loop.name}
          </span>
          <span className="text-xs text-text-muted">
            @{loop.agent}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
          <span>{progress}% • {loop.currentStep}/{loop.totalSteps}</span>
          <span>{formatNumber(loop.tokensUsed)} tokens</span>
          <span>{formatCost(loop.cost)}</span>
        </div>
      </div>

      {/* Arrow */}
      {onClick && (
        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      )}
    </div>
  );
}

export default LoopCard;
