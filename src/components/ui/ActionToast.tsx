"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult, ActionStatus } from "@/types/actions";

interface ActionToastProps {
  /** The action result to display */
  result: ActionResult;
  /** Duration to show toast (ms), 0 = manual dismiss */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Optional link to related resource */
  link?: {
    href: string;
    label: string;
  };
}

const statusConfig: Record<ActionStatus, {
  icon: typeof CheckCircle;
  bgClass: string;
  textClass: string;
  label: string;
}> = {
  completed: {
    icon: CheckCircle,
    bgClass: "bg-success/10 border-success/30",
    textClass: "text-success",
    label: "Success",
  },
  failed: {
    icon: XCircle,
    bgClass: "bg-error/10 border-error/30",
    textClass: "text-error",
    label: "Failed",
  },
  pending: {
    icon: AlertCircle,
    bgClass: "bg-warning/10 border-warning/30",
    textClass: "text-warning",
    label: "Pending",
  },
  running: {
    icon: AlertCircle,
    bgClass: "bg-brand-orange/10 border-brand-orange/30",
    textClass: "text-brand-orange",
    label: "Running",
  },
  cancelled: {
    icon: XCircle,
    bgClass: "bg-muted border-border",
    textClass: "text-muted-foreground",
    label: "Cancelled",
  },
};

/**
 * ActionToast - Toast notification for action results
 * 
 * Features:
 * - Auto-dismiss with configurable duration
 * - Manual dismiss via close button
 * - Status-based styling (success, error, etc.)
 * - Optional link to related resource
 * - Slide-in animation
 */
export function ActionToast({
  result,
  duration = 5000,
  onDismiss,
  link,
}: ActionToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const config = statusConfig[result.status];
  const Icon = config.icon;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Wait for exit animation
  }, [onDismiss]);

  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "max-w-md w-full p-4 rounded-xl",
        "border shadow-lg backdrop-blur-md",
        config.bgClass,
        "transition-all duration-200",
        isExiting
          ? "opacity-0 translate-x-4"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.textClass)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Action type and status */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground capitalize">
              {result.action.type}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded", config.bgClass, config.textClass)}>
              {config.label}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {result.message}
          </p>

          {/* Error details */}
          {result.error && (
            <p className="mt-1 text-xs text-error">
              {result.error.message}
            </p>
          )}

          {/* Optional link */}
          {link && (
            <a
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1 mt-2",
                "text-xs text-brand-teal hover:text-brand-teal/80",
                "transition-colors"
              )}
            >
              {link.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 p-1 rounded-lg",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-accent transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
          )}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Duration indicator (optional) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border rounded-b-xl overflow-hidden">
          <div
            className={cn("h-full", config.textClass.replace("text-", "bg-"))}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/**
 * ActionToastContainer - Manages multiple action toasts
 */
interface ToastItem {
  id: string;
  result: ActionResult;
  link?: { href: string; label: string };
}

interface ActionToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ActionToastContainer({
  toasts,
  onDismiss,
}: ActionToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * -8}px)`,
            zIndex: toasts.length - index,
          }}
        >
          <ActionToast
            result={toast.result}
            link={toast.link}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default ActionToast;
