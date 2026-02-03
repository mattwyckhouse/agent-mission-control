"use client";

import { useState, useCallback } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  Moon,
  Sun,
  Bell,
  DollarSign,
  Palette,
  Save,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Settings {
  theme: "dark" | "light" | "system";
  notifications: {
    enabled: boolean;
    taskUpdates: boolean;
    agentAlerts: boolean;
    costAlerts: boolean;
  };
  costs: {
    dailyBudget: number;
    weeklyBudget: number;
    monthlyBudget: number;
    alertThreshold: number; // 0-1
  };
  display: {
    compactMode: boolean;
    showAgentEmoji: boolean;
    dateFormat: "relative" | "absolute";
  };
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  notifications: {
    enabled: true,
    taskUpdates: true,
    agentAlerts: true,
    costAlerts: true,
  },
  costs: {
    dailyBudget: 50,
    weeklyBudget: 200,
    monthlyBudget: 500,
    alertThreshold: 0.8,
  },
  display: {
    compactMode: false,
    showAgentEmoji: true,
    dateFormat: "relative",
  },
};

interface SettingsPanelProps {
  settings?: Partial<Settings>;
  onSave: (settings: Settings) => void;
  onReset?: () => void;
  className?: string;
}

/**
 * SettingsPanel - Configuration panel for user preferences
 * 
 * Features:
 * - Theme selection
 * - Notification preferences
 * - Cost budget settings
 * - Display options
 */
export function SettingsPanel({
  settings: initialSettings,
  onSave,
  onReset,
  className,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...initialSettings?.notifications },
    costs: { ...DEFAULT_SETTINGS.costs, ...initialSettings?.costs },
    display: { ...DEFAULT_SETTINGS.display, ...initialSettings?.display },
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = useCallback(<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const updateNested = useCallback((
    key: "notifications" | "costs" | "display",
    nestedKey: string,
    value: unknown
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...(prev[key] as Record<string, unknown>), [nestedKey]: value },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave(settings);
    setHasChanges(false);
  }, [settings, onSave]);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    onReset?.();
  }, [onReset]);

  const inputClassName = cn(
    "px-3 py-2 rounded-lg text-sm",
    "bg-background border border-border",
    "text-foreground",
    "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Theme */}
      <GlassCard variant="glass-2">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-brand-teal" />
          <h3 className="text-sm font-semibold text-foreground">Theme</h3>
        </div>
        <div className="flex gap-2">
          {(["dark", "light", "system"] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => updateSettings("theme", theme)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "border transition-colors",
                settings.theme === theme
                  ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                  : "border-border hover:border-muted-foreground text-muted-foreground"
              )}
            >
              {theme === "dark" && <Moon className="w-4 h-4" />}
              {theme === "light" && <Sun className="w-4 h-4" />}
              {theme === "system" && <span className="w-4 h-4">🖥</span>}
              <span className="capitalize">{theme}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard variant="glass-2">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-brand-teal" />
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: "enabled" as const, label: "Enable notifications" },
            { key: "taskUpdates" as const, label: "Task updates" },
            { key: "agentAlerts" as const, label: "Agent alerts" },
            { key: "costAlerts" as const, label: "Cost alerts" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) => updateNested("notifications", key, e.target.checked)}
                className="w-4 h-4 rounded border-border text-brand-teal focus:ring-brand-teal/50"
              />
            </label>
          ))}
        </div>
      </GlassCard>

      {/* Cost Budgets */}
      <GlassCard variant="glass-2">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-brand-teal" />
          <h3 className="text-sm font-semibold text-foreground">Cost Budgets</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Daily Budget ($)
            </label>
            <input
              type="number"
              value={settings.costs.dailyBudget}
              onChange={(e) => updateNested("costs", "dailyBudget", Number(e.target.value))}
              className={inputClassName}
              min={0}
              step={10}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Weekly Budget ($)
            </label>
            <input
              type="number"
              value={settings.costs.weeklyBudget}
              onChange={(e) => updateNested("costs", "weeklyBudget", Number(e.target.value))}
              className={inputClassName}
              min={0}
              step={50}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Monthly Budget ($)
            </label>
            <input
              type="number"
              value={settings.costs.monthlyBudget}
              onChange={(e) => updateNested("costs", "monthlyBudget", Number(e.target.value))}
              className={inputClassName}
              min={0}
              step={100}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              value={Math.round(settings.costs.alertThreshold * 100)}
              onChange={(e) => updateNested("costs", "alertThreshold", Number(e.target.value) / 100)}
              className={inputClassName}
              min={0}
              max={100}
              step={5}
            />
          </div>
        </div>
      </GlassCard>

      {/* Display */}
      <GlassCard variant="glass-2">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-brand-teal" />
          <h3 className="text-sm font-semibold text-foreground">Display</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Compact mode</span>
            <input
              type="checkbox"
              checked={settings.display.compactMode}
              onChange={(e) => updateNested("display", "compactMode", e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-teal focus:ring-brand-teal/50"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Show agent emoji</span>
            <input
              type="checkbox"
              checked={settings.display.showAgentEmoji}
              onChange={(e) => updateNested("display", "showAgentEmoji", e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-teal focus:ring-brand-teal/50"
            />
          </label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Date format</span>
            <select
              value={settings.display.dateFormat}
              onChange={(e) => updateNested("display", "dateFormat", e.target.value as "relative" | "absolute")}
              className={cn(inputClassName, "w-32")}
            >
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button
          variant="secondary"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export default SettingsPanel;
