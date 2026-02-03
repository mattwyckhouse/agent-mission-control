"use client";

import { useEffect, useCallback, useRef } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type ShortcutHandler = () => void;

interface Shortcut {
  combo: KeyCombo | KeyCombo[];
  handler: ShortcutHandler;
  description?: string;
  /** Don't trigger when in input fields */
  ignoreInputs?: boolean;
}

/**
 * useKeyboardShortcuts - Global keyboard shortcut handler
 * 
 * Features:
 * - Multiple key combos per shortcut
 * - Modifier key support (Ctrl, Meta, Shift, Alt)
 * - Input field awareness
 * - Sequential shortcuts (g then h)
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const sequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isInputElement = useCallback((element: EventTarget | null): boolean => {
    if (!element) return false;
    const tagName = (element as HTMLElement).tagName?.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select" ||
      (element as HTMLElement).isContentEditable;
  }, []);

  const matchesCombo = useCallback((event: KeyboardEvent, combo: KeyCombo): boolean => {
    const key = event.key.toLowerCase();
    const comboKey = combo.key.toLowerCase();
    
    // Check modifiers
    const ctrlMatch = combo.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
    const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = combo.alt ? event.altKey : !event.altKey;
    
    // For meta specifically (⌘ on Mac)
    if (combo.meta !== undefined) {
      if (combo.meta !== event.metaKey) return false;
    }

    return key === comboKey && ctrlMatch && shiftMatch && altMatch;
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Build sequence
    const key = event.key.toLowerCase();
    
    // Clear sequence timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }

    // Add to sequence
    sequenceRef.current.push(key);
    
    // Reset sequence after 1 second
    sequenceTimeoutRef.current = setTimeout(() => {
      sequenceRef.current = [];
    }, 1000);

    // Check shortcuts
    for (const shortcut of shortcuts) {
      // Skip if in input and ignoreInputs is true
      if (shortcut.ignoreInputs !== false && isInputElement(event.target)) {
        continue;
      }

      const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];
      
      for (const combo of combos) {
        if (matchesCombo(event, combo)) {
          event.preventDefault();
          shortcut.handler();
          sequenceRef.current = [];
          return;
        }
      }
    }

    // Check for sequential shortcuts (e.g., "g h" for go home)
    const sequence = sequenceRef.current.join(" ");
    for (const shortcut of shortcuts) {
      if (shortcut.ignoreInputs !== false && isInputElement(event.target)) {
        continue;
      }

      const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];
      for (const combo of combos) {
        // Check if combo.key is a sequence like "g h"
        if (combo.key.includes(" ") && combo.key === sequence) {
          event.preventDefault();
          shortcut.handler();
          sequenceRef.current = [];
          return;
        }
      }
    }
  }, [shortcuts, isInputElement, matchesCombo]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Common shortcut definitions
 */
export const COMMON_SHORTCUTS = {
  // Navigation
  goHome: { key: "g h" },
  goTasks: { key: "g t" },
  goCosts: { key: "g c" },
  goSettings: { key: "g s" },
  goRalph: { key: "g r" },
  
  // Actions
  search: { key: "k", meta: true },
  searchAlt: { key: "k", ctrl: true },
  newTask: { key: "n" },
  refresh: { key: "r" },
  escape: { key: "Escape" },
  
  // Help
  showHelp: { key: "?" },
} as const;

export default useKeyboardShortcuts;
