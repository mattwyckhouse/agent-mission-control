import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

interface SegmentedProgressProps {
  current: number;
  total: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const variantStyles = {
  default: "bg-[var(--color-brand-teal)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-brand-orange)]",
  error: "bg-[var(--color-error)]",
};

/**
 * ProgressBar - Single progress indicator
 * 
 * Features:
 * - Percentage-based progress (0-100)
 * - Multiple sizes and color variants
 * - Optional label display
 * - Optional shimmer animation
 */
export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-[var(--color-iron-400)]">
            {label || "Progress"}
          </span>
          <span className="text-xs font-medium text-[var(--color-iron-25)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full overflow-hidden",
          "bg-[var(--color-iron-700)]",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantStyles[variant],
            animated && "relative overflow-hidden"
          )}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[progress-shimmer_2s_linear_infinite]" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SegmentedProgress - Step-based progress indicator
 * 
 * Shows progress as discrete segments (e.g., "Step 3/8")
 */
export function SegmentedProgress({
  current,
  total,
  size = "sm",
  className,
}: SegmentedProgressProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex-1 rounded-sm transition-colors",
            sizeStyles[size],
            index < current
              ? "bg-[var(--color-brand-teal)]"
              : "bg-[var(--color-iron-700)]"
          )}
        />
      ))}
    </div>
  );
}

export default ProgressBar;
