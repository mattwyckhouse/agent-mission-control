"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bot,
  ListTodo,
  DollarSign,
  Settings,
  Home,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent, Task } from "@/types";

interface CommandItem {
  id: string;
  type: "page" | "agent" | "task" | "action";
  title: string;
  subtitle?: string;
  icon: typeof Search;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  /** Available agents for search */
  agents?: Agent[];
  /** Available tasks for search */
  tasks?: Task[];
  /** Additional custom commands */
  commands?: CommandItem[];
  /** Callback when palette closes */
  onClose?: () => void;
}

/**
 * CommandPalette - Global search and command palette (⌘K)
 * 
 * Features:
 * - Fuzzy search across pages, agents, tasks
 * - Keyboard navigation
 * - Command shortcuts
 * - Recent items
 */
export function CommandPalette({
  agents = [],
  tasks = [],
  commands = [],
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Default navigation commands
  const defaultCommands: CommandItem[] = useMemo(() => [
    {
      id: "nav-home",
      type: "page",
      title: "Dashboard",
      subtitle: "Go to home",
      icon: Home,
      shortcut: "G H",
      onSelect: () => router.push("/"),
    },
    {
      id: "nav-tasks",
      type: "page",
      title: "Tasks",
      subtitle: "View all tasks",
      icon: ListTodo,
      shortcut: "G T",
      onSelect: () => router.push("/tasks"),
    },
    {
      id: "nav-costs",
      type: "page",
      title: "Costs",
      subtitle: "Cost tracker",
      icon: DollarSign,
      shortcut: "G C",
      onSelect: () => router.push("/costs"),
    },
    {
      id: "nav-ralph",
      type: "page",
      title: "Ralph",
      subtitle: "Build orchestrator",
      icon: Zap,
      shortcut: "G R",
      onSelect: () => router.push("/ralph"),
    },
  ], [router]);

  // Convert agents to command items
  const agentCommands: CommandItem[] = useMemo(() => 
    agents.map(agent => ({
      id: `agent-${agent.id}`,
      type: "agent" as const,
      title: `${agent.emoji} ${agent.display_name}`,
      subtitle: agent.domain,
      icon: Bot,
      onSelect: () => router.push(`/agent/${agent.id}`),
    })), [agents, router]);

  // Convert tasks to command items
  const taskCommands: CommandItem[] = useMemo(() => 
    tasks.slice(0, 10).map(task => ({
      id: `task-${task.id}`,
      type: "task" as const,
      title: task.title,
      subtitle: `${task.priority} · ${task.status}`,
      icon: ListTodo,
      onSelect: () => router.push(`/tasks?id=${task.id}`),
    })), [tasks, router]);

  // All commands
  const allCommands = useMemo(() => [
    ...defaultCommands,
    ...commands,
    ...agentCommands,
    ...taskCommands,
  ], [defaultCommands, commands, agentCommands, taskCommands]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return allCommands.slice(0, 10);

    const lower = query.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.title.toLowerCase().includes(lower) ||
      cmd.subtitle?.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [allCommands, query]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          onClose?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].onSelect();
            setIsOpen(false);
            setQuery("");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback((cmd: CommandItem) => {
    cmd.onSelect();
    setIsOpen(false);
    setQuery("");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          onClose?.();
        }}
      />

      {/* Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-2xl overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-150"
        )}>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a command..."
              className={cn(
                "flex-1 bg-transparent text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none"
              )}
            />
            <kbd className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCommands.map((cmd, index) => {
                  const Icon = cmd.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                        "transition-colors",
                        isSelected
                          ? "bg-brand-teal/10 text-brand-teal"
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cmd.title}
                        </p>
                        {cmd.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {cmd.subtitle}
                          </p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-brand-teal" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
              <span>to select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
