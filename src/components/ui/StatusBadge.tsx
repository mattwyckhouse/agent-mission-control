import { cn } from "@/lib/utils";

export type AgentStatus = "active" | "idle" | "working" | "error" | "offline";
export type TaskStatus = "urgent" | "action" | "in-progress" | "done";

interface StatusBadgeProps {
  status: AgentStatus | TaskStatus;
  label?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  AgentStatus | TaskStatus,
  { color: string; bg: string; label: string; dotClass?: string }
> = {
  // Agent statuses
  active: {
    color: "text-[#1BD0B8]",
    bg: "bg-[rgba(27,208,184,0.15)]",
    label: "Active",
    dotClass: "bg-[#1BD0B8] animate-pulse",
  },
  idle: {
    color: "text-[#8E9296]",
    bg: "bg-[rgba(142,146,150,0.15)]",
    label: "Idle",
    dotClass: "bg-[#8E9296]",
  },
  working: {
    color: "text-[#F27229]",
    bg: "bg-[rgba(242,114,41,0.15)]",
    label: "Working",
    dotClass: "bg-[#F27229] animate-pulse",
  },
  error: {
    color: "text-[#DE5E57]",
    bg: "bg-[rgba(222,94,87,0.15)]",
    label: "Error",
    dotClass: "bg-[#DE5E57] animate-pulse",
  },
  offline: {
    color: "text-[#4E5257]",
    bg: "bg-[rgba(78,82,87,0.15)]",
    label: "Offline",
    dotClass: "bg-[#4E5257]",
  },
  // Task statuses
  urgent: {
    color: "text-[#DE5E57]",
    bg: "bg-[rgba(222,94,87,0.15)]",
    label: "Urgent",
  },
  action: {
    color: "text-[#F19D38]",
    bg: "bg-[rgba(241,157,56,0.15)]",
    label: "Action",
  },
  "in-progress": {
    color: "text-[#4CA7EE]",
    bg: "bg-[rgba(76,167,238,0.15)]",
    label: "In Progress",
  },
  done: {
    color: "text-[#67AD5C]",
    bg: "bg-[rgba(103,173,92,0.15)]",
    label: "Done",
  },
};

/**
 * StatusBadge - Agent/task status indicator
 * 
 * Features:
 * - Multiple status types for agents and tasks
 * - Optional status dot with pulse animation
 * - Two sizes (sm, md)
 * - Semantic colors with transparent backgrounds
 */
export function StatusBadge({
  status,
  label,
  showDot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.color,
        config.bg,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {showDot && config.dotClass && (
        <span
          className={cn(
            "rounded-full",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            config.dotClass
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
