/**
 * BarChart — Horizontal bar chart for agent costs
 * 
 * Displays labeled horizontal bars with values, perfect for
 * comparing agent costs, token usage, or other metrics.
 */

import { cn } from "@/lib/utils";

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  maxValue?: number;
  formatValue?: (value: number) => string;
  className?: string;
  barColor?: string;
  showLabels?: boolean;
  labelWidth?: number;
  valueWidth?: number;
  animate?: boolean;
}

export function BarChart({
  data,
  maxValue,
  formatValue = (v) => v.toLocaleString(),
  className,
  barColor = "bg-brand-teal",
  showLabels = true,
  labelWidth = 80,
  valueWidth = 60,
  animate = true,
}: BarChartProps) {
  // Calculate max from data if not provided
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {data.map((item, index) => {
        const percentage = Math.min((item.value / max) * 100, 100);
        
        return (
          <div
            key={item.label}
            className="flex items-center gap-3"
            style={{
              animationDelay: animate ? `${index * 50}ms` : undefined,
            }}
          >
            {/* Label */}
            {showLabels && (
              <div
                className="shrink-0 truncate text-sm text-muted-foreground"
                style={{ width: `${labelWidth}px` }}
              >
                {item.label}
              </div>
            )}

            {/* Bar Container */}
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              {/* Bar Fill */}
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  item.color ?? barColor
                )}
                style={{
                  width: `${percentage}%`,
                  transitionDelay: animate ? `${index * 50}ms` : undefined,
                }}
              />
            </div>

            {/* Value */}
            <div
              className="shrink-0 text-right text-sm font-medium text-foreground"
              style={{ width: `${valueWidth}px` }}
            >
              {formatValue(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Variant for currency display (e.g., cost breakdown)
export function CostBarChart({
  data,
  className,
}: {
  data: BarChartItem[];
  className?: string;
}) {
  return (
    <BarChart
      data={data}
      formatValue={(v) => `$${v.toFixed(2)}`}
      className={className}
      barColor="bg-brand-teal"
    />
  );
}

// Variant for token display
export function TokenBarChart({
  data,
  className,
}: {
  data: BarChartItem[];
  className?: string;
}) {
  return (
    <BarChart
      data={data}
      formatValue={(v) => {
        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
        return v.toString();
      }}
      className={className}
      barColor="bg-brand-orange"
      valueWidth={70}
    />
  );
}

export default BarChart;
