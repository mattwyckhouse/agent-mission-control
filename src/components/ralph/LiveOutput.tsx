"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Info, AlertTriangle, ChevronDown } from "lucide-react";
import type { RalphOutput } from "@/types";

interface LiveOutputProps {
  output: RalphOutput[];
  maxHeight?: number;
  autoScroll?: boolean;
  className?: string;
}

interface OutputLineProps {
  entry: RalphOutput;
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
}

function OutputIcon({ type }: { type: RalphOutput["type"] }) {
  switch (type) {
    case "success":
      return <Check className="w-4 h-4 text-success flex-shrink-0" />;
    case "error":
      return <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />;
    case "info":
    default:
      return <Info className="w-4 h-4 text-brand-orange flex-shrink-0" />;
  }
}

function OutputLine({ entry }: OutputLineProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5 px-2 rounded-md",
        "hover:bg-glass-1 transition-colors",
        entry.type === "error" && "bg-error/5"
      )}
    >
      <span className="text-xs text-muted-foreground font-mono tabular-nums flex-shrink-0 pt-0.5">
        {formatTimestamp(entry.timestamp)}
      </span>
      <OutputIcon type={entry.type} />
      <span
        className={cn(
          "text-sm leading-relaxed flex-1",
          entry.type === "success" && "text-foreground",
          entry.type === "error" && "text-error",
          entry.type === "info" && "text-muted-foreground"
        )}
      >
        {entry.message}
      </span>
    </div>
  );
}

export function LiveOutput({
  output,
  maxHeight = 300,
  autoScroll = true,
  className,
}: LiveOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, autoScroll]);

  if (output.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-6",
          "bg-glass-1 rounded-lg border border-border",
          "text-muted-foreground text-sm",
          className
        )}
        style={{ height: maxHeight }}
      >
        <div className="text-center">
          <Info className="w-5 h-5 mx-auto mb-2 opacity-50" />
          <p>Waiting for output...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className={cn(
          "overflow-y-auto overflow-x-hidden",
          "bg-glass-1 rounded-lg border border-border",
          "custom-scrollbar"
        )}
        style={{ maxHeight }}
      >
        <div className="p-2 space-y-0.5">
          {output.map((entry, index) => (
            <OutputLine key={`${entry.timestamp}-${index}`} entry={entry} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll indicator when not at bottom */}
      {output.length > 5 && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className={cn(
            "absolute bottom-2 right-2",
            "p-1.5 rounded-full",
            "bg-card/90 border border-border",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-200",
            "hover:bg-glass-2"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Compact variant for embedded displays
export function LiveOutputCompact({
  output,
  maxLines = 5,
  className,
}: {
  output: RalphOutput[];
  maxLines?: number;
  className?: string;
}) {
  const recentOutput = output.slice(-maxLines);

  return (
    <div
      className={cn(
        "bg-glass-1 rounded-md border border-border p-2",
        "font-mono text-xs",
        className
      )}
    >
      {recentOutput.length === 0 ? (
        <span className="text-muted-foreground">No output yet...</span>
      ) : (
        <div className="space-y-0.5">
          {recentOutput.map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className={cn(
                "truncate",
                entry.type === "success" && "text-success",
                entry.type === "error" && "text-error",
                entry.type === "info" && "text-muted-foreground"
              )}
            >
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
