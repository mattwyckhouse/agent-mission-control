"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AlertTriangle, CheckCircle, TrendingUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostBudgetProps {
  /** Current spend amount */
  currentSpend: number;
  /** Budget limit */
  budgetLimit: number;
  /** Warning threshold (0-1, e.g., 0.8 = 80%) */
  warningThreshold?: number;
  /** Period label (e.g., "This Month", "Today") */
  periodLabel?: string;
  /** Projected spend (optional) */
  projectedSpend?: number;
  /** Whether to show notification settings */
  showNotifyButton?: boolean;
  /** Callback for notification settings */
  onNotifyClick?: () => void;
  /** Additional class names */
  className?: string;
}

type BudgetStatus = "safe" | "warning" | "critical" | "exceeded";

/**
 * CostBudget - Budget tracking with progress bar and alerts
 * 
 * Features:
 * - Progress bar with color coding
 * - Status indicator (safe/warning/critical/exceeded)
 * - Projected spend calculation
 * - Notification settings
 */
export function CostBudget({
  currentSpend,
  budgetLimit,
  warningThreshold = 0.75,
  periodLabel = "This Month",
  projectedSpend,
  showNotifyButton = true,
  onNotifyClick,
  className,
}: CostBudgetProps) {
  const percentUsed = useMemo(() => {
    if (budgetLimit <= 0) return 0;
    return Math.min((currentSpend / budgetLimit) * 100, 150); // Cap at 150% for display
  }, [currentSpend, budgetLimit]);

  const status: BudgetStatus = useMemo(() => {
    const ratio = currentSpend / budgetLimit;
    if (ratio >= 1) return "exceeded";
    if (ratio >= 0.9) return "critical";
    if (ratio >= warningThreshold) return "warning";
    return "safe";
  }, [currentSpend, budgetLimit, warningThreshold]);

  const remaining = Math.max(budgetLimit - currentSpend, 0);

  const statusConfig: Record<BudgetStatus, {
    color: string;
    bgColor: string;
    icon: typeof CheckCircle;
    label: string;
  }> = {
    safe: {
      color: "text-success",
      bgColor: "bg-success/10",
      icon: CheckCircle,
      label: "On Track",
    },
    warning: {
      color: "text-warning",
      bgColor: "bg-warning/10",
      icon: TrendingUp,
      label: "Approaching Limit",
    },
    critical: {
      color: "text-brand-orange",
      bgColor: "bg-brand-orange/10",
      icon: AlertTriangle,
      label: "Near Limit",
    },
    exceeded: {
      color: "text-error",
      bgColor: "bg-error/10",
      icon: AlertTriangle,
      label: "Budget Exceeded",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <GlassCard variant="glass-2" className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Budget: {periodLabel}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${budgetLimit.toFixed(2)} limit
          </p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          config.bgColor,
          config.color
        )}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <ProgressBar
          value={percentUsed}
          max={100}
          size="md"
          variant={
            status === "exceeded" ? "error" :
            status === "critical" ? "warning" :
            status === "warning" ? "warning" :
            "success"
          }
          showLabel
          label={`${Math.min(percentUsed, 100).toFixed(0)}% of budget`}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Spent</p>
          <p className={cn(
            "font-semibold",
            status === "exceeded" ? "text-error" : "text-foreground"
          )}>
            ${currentSpend.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Remaining</p>
          <p className={cn(
            "font-semibold",
            remaining === 0 ? "text-error" : "text-success"
          )}>
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Projected Spend */}
      {projectedSpend !== undefined && projectedSpend > currentSpend && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Projected by end of period
            </span>
            <span className={cn(
              "text-sm font-medium",
              projectedSpend > budgetLimit ? "text-error" : "text-muted-foreground"
            )}>
              ${projectedSpend.toFixed(2)}
              {projectedSpend > budgetLimit && (
                <span className="ml-1 text-xs">
                  (+${(projectedSpend - budgetLimit).toFixed(2)} over)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Notification Button */}
      {showNotifyButton && (
        <button
          onClick={onNotifyClick}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2",
            "px-3 py-2 rounded-lg text-sm",
            "bg-muted/50 hover:bg-muted/80 transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="w-4 h-4" />
          Set Budget Alerts
        </button>
      )}
    </GlassCard>
  );
}

export default CostBudget;
