import { cn } from "@/lib/utils";

// ----- Base Skeleton -----

interface SkeletonProps {
  className?: string;
  /** Width - can be fixed (e.g., "200px") or responsive (e.g., "w-full") */
  width?: string;
  /** Height - can be fixed (e.g., "20px") or responsive (e.g., "h-4") */
  height?: string;
  /** Make it circular */
  circle?: boolean;
  /** Disable animation for reduced motion */
  animate?: boolean;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Skeleton — Loading placeholder with shimmer animation
 *
 * Uses CSS animation from animations.css (shimmer keyframe)
 */
export function Skeleton({
  className,
  width,
  height,
  circle = false,
  animate = true,
  style: externalStyle,
}: SkeletonProps) {
  const inlineStyle: React.CSSProperties = { ...externalStyle };
  if (width && !width.startsWith("w-")) inlineStyle.width = width;
  if (height && !height.startsWith("h-")) inlineStyle.height = height;

  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        animate && "animate-pulse",
        circle && "rounded-full",
        // Allow Tailwind width/height classes
        width?.startsWith("w-") && width,
        height?.startsWith("h-") && height,
        className
      )}
      style={inlineStyle}
      aria-hidden="true"
    />
  );
}

// ----- Skeleton Text -----

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

/**
 * SkeletonText — Multiple lines of skeleton text
 */
export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = "75%",
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          className={cn(
            "w-full",
            i === lines - 1 && lastLineWidth && `w-[${lastLineWidth}]`
          )}
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

// ----- Skeleton Card -----

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

/**
 * SkeletonCard — Card-shaped loading placeholder
 */
export function SkeletonCard({
  className,
  showAvatar = true,
  lines = 2,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        "bg-card/50 border border-border",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        {showAvatar && <Skeleton width="40px" height="40px" circle />}
        <div className="flex-1 space-y-2">
          <Skeleton height="h-5" className="w-1/3" />
          <SkeletonText lines={lines} />
        </div>
      </div>
    </div>
  );
}

// ----- Skeleton Agent Card -----

/**
 * SkeletonAgentCard — Matches AgentCard layout
 */
export function SkeletonAgentCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        "bg-card/50 border border-border",
        "h-[120px]",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        {/* Avatar circle */}
        <Skeleton width="48px" height="48px" circle />

        <div className="flex-1 space-y-2">
          {/* Name + status dot */}
          <div className="flex items-center gap-2">
            <Skeleton height="h-5" className="w-24" />
            <Skeleton width="8px" height="8px" circle />
          </div>

          {/* Domain */}
          <Skeleton height="h-3" className="w-32" />

          {/* Bottom stats */}
          <div className="flex gap-4 mt-3">
            <Skeleton height="h-4" className="w-16" />
            <Skeleton height="h-4" className="w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Skeleton Metric Card -----

/**
 * SkeletonMetricCard — Matches MetricCard layout
 */
export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl",
        "bg-card/50 border border-border",
        "h-[100px]",
        className
      )}
      aria-hidden="true"
    >
      <div className="space-y-3">
        {/* Label */}
        <Skeleton height="h-3" className="w-20" />
        {/* Big value */}
        <Skeleton height="h-8" className="w-24" />
        {/* Trend */}
        <Skeleton height="h-3" className="w-16" />
      </div>
    </div>
  );
}

// ----- Skeleton Table -----

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * SkeletonTable — Table loading placeholder
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-card/30 border border-border",
        className
      )}
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            height="h-4"
            className={cn(
              i === 0 ? "w-1/4" : "w-1/6",
              "flex-shrink-0"
            )}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex gap-4 p-4 border-b border-border/50 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              height="h-4"
              className={cn(
                colIdx === 0 ? "w-1/4" : "w-1/6",
                "flex-shrink-0"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ----- Skeleton Grid -----

interface SkeletonGridProps {
  count?: number;
  columns?: number;
  className?: string;
  cardType?: "agent" | "metric" | "generic";
}

/**
 * SkeletonGrid — Grid of skeleton cards
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  className,
  cardType = "agent",
}: SkeletonGridProps) {
  const Card =
    cardType === "agent"
      ? SkeletonAgentCard
      : cardType === "metric"
      ? SkeletonMetricCard
      : SkeletonCard;

  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
