"use client";

import { cn } from "@/lib/utils";
import type { Agent, TaskPriority } from "@/types";

export interface TaskFilterValues {
  agentId: string | null;
  priority: TaskPriority | null;
  dateRange: "all" | "today" | "week" | "month";
  search: string;
}

interface TaskFiltersProps {
  filters: TaskFilterValues;
  onFilterChange: (filters: TaskFilterValues) => void;
  agents: Agent[];
  className?: string;
}

const priorityOptions: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "🔴 P0 - Urgent" },
  { value: "high", label: "🟠 P1 - High" },
  { value: "medium", label: "🟡 P2 - Medium" },
  { value: "low", label: "🟢 P3 - Low" },
];

const dateOptions: { value: TaskFilterValues["dateRange"]; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

/**
 * TaskFilters - Filter controls for the task queue
 * 
 * Provides:
 * - Agent dropdown filter
 * - Priority dropdown filter
 * - Date range dropdown filter
 * - Search input
 */
export function TaskFilters({
  filters,
  onFilterChange,
  agents,
  className,
}: TaskFiltersProps) {
  const selectStyles = cn(
    "h-9 px-3 rounded-full",
    "bg-[rgba(17,18,20,0.56)] backdrop-blur-md",
    "border border-[rgba(255,255,255,0.08)]",
    "text-sm text-[#E8E9EA]",
    "focus:outline-none focus:border-[rgba(27,208,184,0.5)]",
    "transition-colors duration-200",
    "cursor-pointer appearance-none",
    "pr-8 bg-no-repeat bg-[length:16px] bg-[right_8px_center]",
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239FA3A8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")]"
  );

  const inputStyles = cn(
    "h-9 px-3 pl-9 rounded-full w-48",
    "bg-[rgba(17,18,20,0.56)] backdrop-blur-md",
    "border border-[rgba(255,255,255,0.08)]",
    "text-sm text-[#E8E9EA] placeholder:text-[#6B7075]",
    "focus:outline-none focus:border-[rgba(27,208,184,0.5)]",
    "transition-colors duration-200"
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7075]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className={inputStyles}
        />
      </div>

      {/* Agent filter */}
      <select
        value={filters.agentId || "all"}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            agentId: e.target.value === "all" ? null : e.target.value,
          })
        }
        className={selectStyles}
      >
        <option value="all">All Agents</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.emoji} {agent.display_name}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority || "all"}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            priority: e.target.value === "all" ? null : (e.target.value as TaskPriority),
          })
        }
        className={selectStyles}
      >
        {priorityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Date range filter */}
      <select
        value={filters.dateRange}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            dateRange: e.target.value as TaskFilterValues["dateRange"],
          })
        }
        className={selectStyles}
      >
        {dateOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear filters button (shows when any filter is active) */}
      {(filters.agentId ||
        filters.priority ||
        filters.dateRange !== "all" ||
        filters.search) && (
        <button
          onClick={() =>
            onFilterChange({
              agentId: null,
              priority: null,
              dateRange: "all",
              search: "",
            })
          }
          className={cn(
            "h-9 px-3 rounded-full",
            "text-sm text-[#9FA3A8]",
            "hover:text-[#E8E9EA] hover:bg-[rgba(255,255,255,0.05)]",
            "transition-colors duration-200"
          )}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default TaskFilters;
