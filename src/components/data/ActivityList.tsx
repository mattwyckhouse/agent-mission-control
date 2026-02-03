"use client";

import { CheckCircle2, Info, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types";

interface ActivityListProps {
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

const typeIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  success: "text-[#00C9A7]", // teal
  info: "text-[#6B7075]",
  warning: "text-[#F5A623]", // orange
  error: "text-[#DE5E57]",
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * ActivityList - Displays a timeline of agent activity
 * 
 * Shows recent activity with timestamps, agent names, and status icons.
 * Based on the Timeline component spec from wireframes.
 */
export function ActivityList({ 
  activities, 
  maxItems = 5,
  showViewAll = true,
  className 
}: ActivityListProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className={cn(
        "p-6 rounded-xl",
        "bg-[rgba(30,33,36,0.4)]",
        "border border-[rgba(255,255,255,0.05)]",
        className
      )}>
        <p className="text-sm text-[#6B7075] text-center">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* Activity Items */}
      <div className="border-l-2 border-[#3A3F44] ml-2 pl-4">
        {displayedActivities.map((activity, index) => {
          const Icon = typeIcons[activity.type];
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 py-2",
                index !== displayedActivities.length - 1 && "border-b border-[rgba(255,255,255,0.03)]"
              )}
            >
              {/* Timestamp */}
              <span className="text-xs text-[#6B7075] font-mono tabular-nums w-16 shrink-0">
                {formatTime(activity.timestamp)}
              </span>

              {/* Status Icon */}
              <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", typeColors[activity.type])} />

              {/* Agent Name */}
              {activity.agentName && (
                <span className="text-sm font-medium text-[#B8BBBF] w-20 shrink-0">
                  {activity.agentName}
                </span>
              )}

              {/* Message */}
              <span className="text-sm text-[#E8E9EA] flex-1">
                {activity.message}
              </span>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {showViewAll && activities.length > maxItems && (
        <div className="pt-2">
          <button className="flex items-center gap-1 text-sm text-[#00C9A7] hover:text-[#00E0B8] transition-colors">
            View all activity
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityList;
