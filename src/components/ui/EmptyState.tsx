"use client";

import { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Search,
  FileQuestion,
  Bot,
  ListTodo,
  AlertCircle,
} from "lucide-react";

type EmptyStateType = "no-data" | "no-results" | "error" | "no-agents" | "no-tasks";

interface EmptyStateProps {
  /** Preset type for common empty states */
  type?: EmptyStateType;
  /** Custom icon */
  icon?: ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

const typeConfig: Record<EmptyStateType, {
  icon: typeof Inbox;
  title: string;
  description: string;
}> = {
  "no-data": {
    icon: Inbox,
    title: "No data yet",
    description: "There's nothing here at the moment. Data will appear once available.",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
  },
  "error": {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We couldn't load the data. Please try again.",
  },
  "no-agents": {
    icon: Bot,
    title: "No agents configured",
    description: "Set up your first agent to start orchestrating work.",
  },
  "no-tasks": {
    icon: ListTodo,
    title: "No tasks yet",
    description: "Create your first task to get started.",
  },
};

const sizeConfig = {
  sm: {
    icon: "w-8 h-8",
    title: "text-sm",
    description: "text-xs",
    padding: "py-6",
    gap: "gap-2",
  },
  md: {
    icon: "w-12 h-12",
    title: "text-base",
    description: "text-sm",
    padding: "py-12",
    gap: "gap-3",
  },
  lg: {
    icon: "w-16 h-16",
    title: "text-lg",
    description: "text-base",
    padding: "py-16",
    gap: "gap-4",
  },
};

/**
 * EmptyState - Placeholder for empty content areas
 * 
 * Features:
 * - Preset types for common scenarios
 * - Custom icon/title/description support
 * - Action buttons
 * - Multiple sizes
 */
export function EmptyState({
  type = "no-data",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const typeDefaults = typeConfig[type];
  const sizes = sizeConfig[size];
  
  const Icon = icon ? null : typeDefaults.icon;
  const displayTitle = title || typeDefaults.title;
  const displayDescription = description || typeDefaults.description;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizes.padding,
      sizes.gap,
      className
    )}>
      {/* Icon */}
      <div className="p-4 rounded-full bg-muted/50">
        {icon || (Icon && <Icon className={cn("text-muted-foreground", sizes.icon)} />)}
      </div>

      {/* Text */}
      <div className={cn("space-y-1 max-w-sm", sizes.gap)}>
        <h3 className={cn("font-semibold text-foreground", sizes.title)}>
          {displayTitle}
        </h3>
        <p className={cn("text-muted-foreground", sizes.description)}>
          {displayDescription}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && (
            <Button
              variant="secondary"
              size={size === "sm" ? "sm" : "md"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === "sm" ? "sm" : "md"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
