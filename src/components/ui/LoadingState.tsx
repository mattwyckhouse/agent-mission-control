"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show full page overlay */
  fullPage?: boolean;
  /** Additional class names */
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "w-4 h-4",
    text: "text-xs",
    gap: "gap-2",
  },
  md: {
    icon: "w-6 h-6",
    text: "text-sm",
    gap: "gap-3",
  },
  lg: {
    icon: "w-8 h-8",
    text: "text-base",
    gap: "gap-4",
  },
};

/**
 * LoadingState - Consistent loading indicator
 * 
 * Features:
 * - Multiple sizes
 * - Optional message
 * - Full page overlay mode
 */
export function LoadingState({
  message = "Loading...",
  size = "md",
  fullPage = false,
  className,
}: LoadingStateProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center",
      config.gap,
      className
    )}>
      <Loader2 className={cn("animate-spin text-brand-teal", config.icon)} />
      {message && (
        <p className={cn("text-muted-foreground", config.text)}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * LoadingSkeleton - Placeholder skeleton for loading content
 */
interface LoadingSkeletonProps {
  /** Skeleton type */
  type?: "text" | "card" | "avatar" | "button";
  /** Number of lines (for text type) */
  lines?: number;
  /** Width */
  width?: string;
  /** Height */
  height?: string;
  /** Additional class names */
  className?: string;
}

export function LoadingSkeleton({
  type = "text",
  lines = 1,
  width,
  height,
  className,
}: LoadingSkeletonProps) {
  const baseClass = "animate-pulse bg-muted rounded";

  switch (type) {
    case "avatar":
      return (
        <div
          className={cn(baseClass, "rounded-full", className)}
          style={{ width: width || "40px", height: height || "40px" }}
        />
      );
    case "button":
      return (
        <div
          className={cn(baseClass, "rounded-lg", className)}
          style={{ width: width || "100px", height: height || "36px" }}
        />
      );
    case "card":
      return (
        <div
          className={cn(baseClass, "rounded-xl", className)}
          style={{ width: width || "100%", height: height || "120px" }}
        />
      );
    case "text":
    default:
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(baseClass, "h-4")}
              style={{ 
                width: i === lines - 1 && lines > 1 ? "70%" : (width || "100%"),
              }}
            />
          ))}
        </div>
      );
  }
}

/**
 * LoadingCard - Card placeholder while loading
 */
export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border border-border bg-card/50 space-y-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <LoadingSkeleton type="avatar" width="32px" height="32px" />
        <div className="flex-1">
          <LoadingSkeleton type="text" width="60%" />
        </div>
      </div>
      <LoadingSkeleton type="text" lines={2} />
      <div className="flex gap-2">
        <LoadingSkeleton type="button" width="60px" height="24px" />
        <LoadingSkeleton type="button" width="60px" height="24px" />
      </div>
    </div>
  );
}

export default LoadingState;
