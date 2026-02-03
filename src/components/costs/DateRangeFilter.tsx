"use client";

import { useState, useCallback } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Preset ranges
const PRESETS: { label: string; getDates: () => Omit<DateRange, "label"> }[] = [
  {
    label: "Today",
    getDates: () => {
      const today = new Date().toISOString().slice(0, 10);
      return { startDate: today, endDate: today };
    },
  },
  {
    label: "Yesterday",
    getDates: () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { startDate: yesterday, endDate: yesterday };
    },
  },
  {
    label: "Last 7 Days",
    getDates: () => {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "Last 30 Days",
    getDates: () => {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "This Month",
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: "Last Month",
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      return { startDate: start, endDate: end };
    },
  },
];

/**
 * DateRangeFilter - Dropdown for selecting date ranges
 * 
 * Features:
 * - Preset ranges (today, last 7 days, etc.)
 * - Custom date inputs
 * - Keyboard accessible
 */
export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);

  const handlePresetSelect = useCallback((preset: typeof PRESETS[number]) => {
    const dates = preset.getDates();
    onChange({ ...dates, label: preset.label });
    setIsOpen(false);
  }, [onChange]);

  const handleCustomApply = useCallback(() => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({
        startDate: customStart,
        endDate: customEnd,
        label: "Custom",
      });
      setIsOpen(false);
    }
  }, [customStart, customEnd, onChange]);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span>{value.label}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-72 p-3 rounded-lg shadow-lg",
            "bg-card border border-border",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}>
            {/* Presets */}
            <div className="space-y-1 mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "px-2 py-1.5 text-sm rounded-md text-left",
                      "hover:bg-muted/50 transition-colors",
                      value.label === preset.label && "bg-brand-teal/10 text-brand-teal"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-3" />

            {/* Custom Range */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Custom Range
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-12">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-sm rounded-md",
                      "bg-background border border-border",
                      "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-12">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-sm rounded-md",
                      "bg-background border border-border",
                      "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    )}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd || customStart > customEnd}
                  className="w-full mt-2"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangeFilter;
