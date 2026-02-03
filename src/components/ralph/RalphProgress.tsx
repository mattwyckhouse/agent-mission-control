"use client";

import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Clock, Zap, DollarSign, TrendingUp } from "lucide-react";

interface RalphProgressProps {
  currentStep: number;
  totalSteps: number;
  tokensUsed?: number;
  cost?: number;
  startedAt?: string;
  lastUpdate?: string;
  estimatedCompletion?: string;
  className?: string;
}

function formatDuration(startMs: number, endMs: number = Date.now()): string {
  const diffMs = endMs - startMs;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${minutes}m`;
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

export function RalphProgress({
  currentStep,
  totalSteps,
  tokensUsed = 0,
  cost = 0,
  startedAt,
  lastUpdate,
  estimatedCompletion,
  className,
}: RalphProgressProps) {
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  const elapsed = startedAt ? formatDuration(new Date(startedAt).getTime()) : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Progress Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-heading font-bold text-foreground">
            {progress}%
          </span>
          <span className="text-sm text-muted-foreground">
            complete
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-heading font-semibold text-foreground">
            Step {currentStep}
          </span>
          <span className="text-lg text-muted-foreground"> / {totalSteps}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar 
        value={progress} 
        size="lg"
        showLabel={false}
        animated
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Elapsed Time */}
        {elapsed && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Elapsed:</span>{" "}
              <span className="font-medium text-foreground">{elapsed}</span>
            </div>
          </div>
        )}

        {/* Tokens Used */}
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-brand-orange" />
          <div>
            <span className="text-muted-foreground">Tokens:</span>{" "}
            <span className="font-medium text-foreground">{formatNumber(tokensUsed)}</span>
          </div>
        </div>

        {/* Cost */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-success" />
          <div>
            <span className="text-muted-foreground">Cost:</span>{" "}
            <span className="font-medium text-foreground">{formatCost(cost)}</span>
          </div>
        </div>

        {/* ETA */}
        {estimatedCompletion && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-brand-teal" />
            <div>
              <span className="text-muted-foreground">ETA:</span>{" "}
              <span className="font-medium text-foreground">
                {formatTime(estimatedCompletion)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground">
          Last update: {formatTime(lastUpdate)}
        </div>
      )}
    </div>
  );
}

// Compact variant for smaller displays
export function RalphProgressCompact({
  currentStep,
  totalSteps,
  className,
}: Pick<RalphProgressProps, "currentStep" | "totalSteps" | "className">) {
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{progress}%</span>
        <span className="text-muted-foreground">
          {currentStep}/{totalSteps}
        </span>
      </div>
      <ProgressBar value={progress} size="sm" showLabel={false} />
    </div>
  );
}
