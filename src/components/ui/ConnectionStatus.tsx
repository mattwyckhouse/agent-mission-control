"use client";

import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

type ConnectionState = "connected" | "connecting" | "disconnected" | "error";

interface ConnectionStatusProps {
  /** Current connection state */
  status: ConnectionState;
  /** Optional label text */
  label?: string;
  /** Show as compact dot only */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

const statusConfig: Record<ConnectionState, {
  icon: typeof Wifi;
  color: string;
  bgColor: string;
  label: string;
  animate?: boolean;
}> = {
  connected: {
    icon: Wifi,
    color: "text-success",
    bgColor: "bg-success/20",
    label: "Live",
  },
  connecting: {
    icon: RefreshCw,
    color: "text-brand-orange",
    bgColor: "bg-brand-orange/20",
    label: "Connecting",
    animate: true,
  },
  disconnected: {
    icon: WifiOff,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Offline",
  },
  error: {
    icon: WifiOff,
    color: "text-error",
    bgColor: "bg-error/20",
    label: "Error",
  },
};

/**
 * ConnectionStatus - Shows real-time connection state
 * 
 * Features:
 * - Visual indicator of WebSocket connection status
 * - Compact (dot only) or full (icon + label) modes
 * - Animated state for connecting
 * 
 * Usage:
 * ```tsx
 * <ConnectionStatus status={realtimeStatus} />
 * <ConnectionStatus status="connected" compact />
 * ```
 */
export function ConnectionStatus({
  status,
  label,
  compact = false,
  className,
}: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          config.bgColor,
          config.animate && "animate-pulse",
          className
        )}
        title={displayLabel}
        aria-label={displayLabel}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn(
          "w-3 h-3",
          config.animate && "animate-spin"
        )}
      />
      <span>{displayLabel}</span>
    </div>
  );
}

export default ConnectionStatus;
