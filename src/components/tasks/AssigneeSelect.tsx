"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface AssigneeSelectProps {
  /** Currently selected agent ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (agentId: string | null) => void;
  /** Available agents */
  agents: Agent[];
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

/**
 * AssigneeSelect - Dropdown to select/unassign an agent
 * 
 * Features:
 * - Shows agent emoji and name
 * - Agent status indicator
 * - Clear selection option
 * - Keyboard navigation
 * - Click outside to close
 */
export function AssigneeSelect({
  value,
  onChange,
  agents,
  disabled = false,
  placeholder = "Unassigned",
  size = "md",
  className,
}: AssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedAgent = value ? agents.find(a => a.id === value) : null;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(prev => !prev);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        if (!isOpen) {
          setIsOpen(true);
        } else if (listRef.current) {
          const first = listRef.current.querySelector('[role="option"]') as HTMLElement;
          first?.focus();
        }
        e.preventDefault();
        break;
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback((agentId: string | null) => {
    onChange(agentId);
    setIsOpen(false);
  }, [onChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-success";
      case "busy": return "bg-brand-orange";
      case "error": return "bg-error";
      default: return "bg-muted-foreground";
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-2",
    md: "h-10 text-sm px-3",
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg",
          "bg-background border border-border",
          "text-left transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-teal/50",
          "hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          sizeClasses[size]
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedAgent ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(selectedAgent.status))} />
            <span className="truncate text-foreground">
              {selectedAgent.emoji} {selectedAgent.display_name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            {placeholder}
          </span>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full max-h-60 overflow-auto",
            "bg-card border border-border rounded-lg shadow-lg",
            "py-1 animate-in fade-in-0 zoom-in-95 duration-100"
          )}
        >
          {/* Unassign option */}
          <li
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect(null)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer",
              "text-sm text-muted-foreground hover:bg-muted/50",
              !value && "bg-muted/30"
            )}
          >
            <X className="w-4 h-4" />
            <span>Unassigned</span>
          </li>

          <li className="border-t border-border my-1" role="separator" />

          {/* Agent options */}
          {agents.map((agent) => (
            <li
              key={agent.id}
              role="option"
              aria-selected={agent.id === value}
              onClick={() => handleSelect(agent.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(agent.id);
                }
              }}
              tabIndex={0}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer",
                "text-sm hover:bg-muted/50 transition-colors",
                "focus:outline-none focus:bg-muted/50",
                agent.id === value && "bg-brand-teal/10 text-brand-teal"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(agent.status))} />
              <span className="flex-shrink-0">{agent.emoji}</span>
              <span className="truncate">{agent.display_name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{agent.domain}</span>
            </li>
          ))}

          {agents.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No agents available
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default AssigneeSelect;
