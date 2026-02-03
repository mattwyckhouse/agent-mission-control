"use client";

import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsPanel, type Settings } from "@/components/settings";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mission-control-settings";

interface Toast {
  type: "success" | "error";
  message: string;
}

/**
 * Settings Page
 * 
 * User preferences and configuration
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings> | undefined>(undefined);
  const [toast, setToast] = useState<Toast | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings({});
      }
    } catch {
      setSettings({});
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = useCallback((newSettings: Settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Apply theme immediately
      if (newSettings.theme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else if (newSettings.theme === "dark") {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      } else {
        // System preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
        document.documentElement.classList.toggle("light", !prefersDark);
      }

      setToast({ type: "success", message: "Settings saved successfully" });
    } catch (error) {
      setToast({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Failed to save settings" 
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToast({ type: "success", message: "Settings reset to defaults" });
  }, []);

  // Don't render until settings are loaded
  if (settings === undefined) {
    return (
      <AppShell>
        <PageHeader
          title="Settings"
          subtitle="Configure your preferences"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="Configure your preferences"
      />

      <div className="max-w-2xl">
        <SettingsPanel
          settings={settings}
          onSave={handleSave}
          onReset={handleReset}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={cn(
            "fixed bottom-4 right-4 z-50",
            "flex items-center gap-3 px-4 py-3 rounded-xl",
            "border shadow-lg backdrop-blur-md",
            "animate-in slide-in-from-right-4",
            toast.type === "success"
              ? "bg-success/10 border-success/30"
              : "bg-error/10 border-error/30"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <XCircle className="w-5 h-5 text-error" />
          )}
          <span className="text-sm text-foreground">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AppShell>
  );
}
