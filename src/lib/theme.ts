/**
 * Theme utilities for dark/light mode with localStorage persistence
 */

export type Theme = "dark" | "light" | "system";

const THEME_KEY = "mission-control-theme";

/**
 * Get the stored theme preference
 */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored;
  }
  return "dark"; // Default to dark
}

/**
 * Store the theme preference
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Get the resolved theme (resolves "system" to actual theme)
 */
export function getResolvedTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;
  
  // Use both class and data-theme for compatibility
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      resolved === "dark" ? "#111214" : "#FAFAFB"
    );
  }
}

/**
 * Initialize theme from localStorage (call on app mount)
 */
export function initializeTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
