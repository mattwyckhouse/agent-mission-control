import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  /** The large value to display */
  value: string | number;
  /** Label text below the value */
  label: string;
  /** Trend information */
  trend?: {
    /** Direction of trend */
    direction: "up" | "down" | "neutral";
    /** Percentage or text to show */
    value: string;
  };
  /** Format as currency */
  isCurrency?: boolean;
  /** Additional class names */
  className?: string;
  /** Icon to show (optional) */
  icon?: React.ReactNode;
  /** Accent color variant */
  variant?: "default" | "teal" | "orange" | "success" | "warning";
}

/**
 * MetricCard - Large stat display
 * 
 * Shows:
 * - Large prominent value
 * - Label/description
 * - Optional trend indicator
 * 
 * Per spec:
 * - Value: 32px desktop, 24px mobile, weight 700
 * - Label: 14px, uppercase, wide tracking
 * - Trend: 12px with directional colors
 */
export function MetricCard({
  value,
  label,
  trend,
  isCurrency,
  className,
  icon,
  variant = "default",
}: MetricCardProps) {
  // Format the value
  const displayValue = isCurrency && typeof value === "number"
    ? `$${value.toFixed(2)}`
    : value;

  // Get trend color classes
  const getTrendClasses = () => {
    if (!trend) return "";
    
    switch (trend.direction) {
      case "up":
        return "text-[#67AD5C]"; // success green
      case "down":
        return "text-[#DE5E57]"; // error red
      case "neutral":
      default:
        return "text-[#6B7075]"; // muted
    }
  };

  // Get trend icon
  const TrendIcon = () => {
    if (!trend) return null;
    
    const iconClass = "w-3.5 h-3.5";
    switch (trend.direction) {
      case "up":
        return <TrendingUp className={iconClass} />;
      case "down":
        return <TrendingDown className={iconClass} />;
      default:
        return <Minus className={iconClass} />;
    }
  };

  // Get accent color for icon
  const getAccentColor = () => {
    switch (variant) {
      case "teal":
        return "text-[#1BD0B8]";
      case "orange":
        return "text-[#F27229]";
      case "success":
        return "text-[#67AD5C]";
      case "warning":
        return "text-[#E6A23C]";
      default:
        return "text-[#E8E9EA]";
    }
  };

  return (
    <div
      className={cn(
        // Base styles - glass card
        "p-4 rounded-xl",
        "bg-[rgba(30,33,36,0.6)] backdrop-blur-md",
        "border border-[rgba(255,255,255,0.08)]",
        // Centered text
        "text-center",
        // Transitions
        "transition-all duration-200 ease-out",
        className
      )}
    >
      {/* Optional icon */}
      {icon && (
        <div className={cn("mb-2 flex justify-center", getAccentColor())}>
          {icon}
        </div>
      )}
      
      {/* Large value */}
      <p 
        className={cn(
          "font-semibold",
          "text-2xl md:text-[32px]", // 24px mobile, 32px desktop
          "leading-tight",
          "text-[#E8E9EA]",
          "tabular-nums", // Ensures numbers align properly
        )}
      >
        {displayValue}
      </p>
      
      {/* Label */}
      <p 
        className={cn(
          "mt-1",
          "text-sm", // 14px
          "font-medium",
          "uppercase",
          "tracking-wide", // letter-spacing
          "text-[#9FA3A8]", // secondary text color
        )}
      >
        {label}
      </p>
      
      {/* Trend indicator */}
      {trend && (
        <div 
          className={cn(
            "mt-2",
            "inline-flex items-center gap-1",
            "text-xs", // 12px
            getTrendClasses(),
          )}
        >
          <TrendIcon />
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
