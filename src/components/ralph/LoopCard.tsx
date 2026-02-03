"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/cards/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SegmentedProgress } from "@/components/ui/ProgressBar";
import { Clock, Zap, DollarSign, ChevronRight } from "lucide-react";
import type { RalphLoop } from "@/types";

interface LoopCardProps {
  loop: RalphLoop;
  onClick?: () => void;
  className?: string;
}

function formatDuration(startTime: string, endTime?: string): string {
  const startMs = new Date(startTime).getTime();
  const endMs = endTime ? new Date(endTime).getTime() : Date.now();
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
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
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

function getPhaseStatus(
  phase: RalphLoop["phase"]
): "active" | "idle" | "working" | "error" | "success" {
  switch (phase) {
    case "done":
      return "success";
    case "blocked":
      return "error";
    case "build":
      return "working";
    case "interview":
    case "plan":
      return "active";
    default:
      return "idle";
  }
}

function getPhaseLabel(phase: RalphLoop["phase"]): string {
  switch (phase) {
    case "done":
      return "Complete";
    case "blocked":
      return "Blocked";
    case "build":
      return "Building";
    case "interview":
      return "Interview";
    case "plan":
      return "Planning";
    default:
      return "Unknown";
  }
}

export function LoopCard({ loop, onClick, className }: LoopCardProps) {
  const isComplete = loop.phase === "done";
  const isBlocked = loop.phase === "blocked";
  const progress = Math.round((loop.currentStep / loop.totalSteps) * 100);

  return (
    <GlassCard
      className={cn(
        "group transition-all duration-200",
        onClick && "cursor-pointer hover:border-brand-teal",
        isComplete && "border-l-2 border-l-success",
        isBlocked && "border-l-2 border-l-error",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-text-primary truncate">
              {loop.name}
            </h3>
            <p className="text-sm text-text-muted">
              {loop.agent} • {formatDate(loop.startedAt)}
            </p>
          </div>
          <StatusBadge status={getPhaseStatus(loop.phase)} label={getPhaseLabel(loop.phase)} />
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Step {loop.currentStep} / {loop.totalSteps}
            </span>
            <span className="font-medium text-text-primary">{progress}%</span>
          </div>
          <SegmentedProgress
            current={loop.currentStep}
            total={Math.min(loop.totalSteps, 12)} // Cap visual segments
            size="sm"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDuration(loop.startedAt, isComplete ? loop.lastUpdate : undefined)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-orange" />
            <span>{formatNumber(loop.tokensUsed)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-success" />
            <span>${loop.cost.toFixed(2)}</span>
          </div>
        </div>

        {/* View Details Link */}
        {onClick && (
          <div className="flex items-center justify-end text-xs text-text-muted group-hover:text-brand-teal transition-colors">
            <span>View details</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Compact variant for lists
export function LoopCardCompact({
  loop,
  onClick,
  className,
}: LoopCardProps) {
  const progress = Math.round((loop.currentStep / loop.totalSteps) * 100);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-glass-1 border border-iron-800",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:bg-glass-2 hover:border-iron-700",
        className
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary truncate">
            {loop.name}
          </span>
          <StatusBadge status={getPhaseStatus(loop.phase)} label={getPhaseLabel(loop.phase)} className="text-[10px] px-1.5 py-0.5" />
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          {loop.agent} • {progress}% • ${loop.cost.toFixed(2)}
        </div>
      </div>
      {onClick && (
        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      )}
    </div>
  );
}
