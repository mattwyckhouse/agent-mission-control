"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Theme,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  getResolvedTheme,
} from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

// External store for theme and mounted state
let currentTheme: Theme = "dark";
let isMounted = false;
const listeners = new Set<() => void>();

function subscribeToStore(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getThemeSnapshot(): Theme {
  // Initialize on first client-side access
  if (typeof window !== "undefined" && !isMounted) {
    isMounted = true;
    const stored = getStoredTheme();
    currentTheme = stored;
    applyTheme(stored);
  }
  return currentTheme;
}

function getThemeServerSnapshot(): Theme {
  return "dark";
}

function getMountedSnapshot(): boolean {
  return isMounted;
}

function getMountedServerSnapshot(): boolean {
  return false;
}

function setThemeExternal(theme: Theme) {
  currentTheme = theme;
  listeners.forEach((l) => l());
}

/**
 * ThemeToggle — Dark/Light/System theme switcher
 * 
 * Cycles through: dark → light → system → dark
 * Persists preference to localStorage
 * Updates document classes immediately
 */
export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  // Use external store to avoid setState in useEffect
  const theme = useSyncExternalStore(
    subscribeToStore,
    getThemeSnapshot,
    getThemeServerSnapshot
  );
  const mounted = useSyncExternalStore(
    subscribeToStore,
    getMountedSnapshot,
    getMountedServerSnapshot
  );

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    const current = getThemeSnapshot();
    const nextTheme: Theme =
      current === "dark" ? "light" : current === "light" ? "system" : "dark";
    
    setStoredTheme(nextTheme);
    applyTheme(nextTheme);
    setThemeExternal(nextTheme);
  }, []);

  // Avoid hydration mismatch - show placeholder until mounted
  if (!mounted) {
    return (
      <button
        className={cn(
          "p-2 rounded-lg",
          "bg-white/5 border border-white/10",
          "text-[var(--color-iron-400)]",
          className
        )}
        aria-label="Toggle theme"
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  const resolved = getResolvedTheme(theme);
  const Icon = theme === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const label =
    theme === "system"
      ? "System"
      : theme === "dark"
      ? "Dark"
      : "Light";

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "p-2 rounded-lg transition-all duration-200",
        "bg-white/5 hover:bg-white/10",
        "border border-white/10 hover:border-white/20",
        "text-[var(--color-iron-400)] hover:text-[var(--color-iron-25)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-teal)]/50",
        showLabel && "flex items-center gap-2 px-3",
        className
      )}
      aria-label={`Current theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      <Icon className="w-4 h-4" />
      {showLabel && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </button>
  );
}

export default ThemeToggle;
