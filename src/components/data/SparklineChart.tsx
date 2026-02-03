/**
 * SparklineChart — Mini daily spend chart
 * 
 * A compact line/area chart for showing trends over time,
 * typically used for daily cost or token usage sparklines.
 */

import { cn } from "@/lib/utils";

interface SparklineChartProps {
  data: number[];
  className?: string;
  height?: number;
  width?: number | "full";
  color?: string;
  fillOpacity?: number;
  showDots?: boolean;
  showArea?: boolean;
  strokeWidth?: number;
  labels?: string[];
  showMinMax?: boolean;
}

export function SparklineChart({
  data,
  className,
  height = 40,
  width = "full",
  color = "var(--color-brand-teal)",
  fillOpacity = 0.15,
  showDots = false,
  showArea = true,
  strokeWidth = 2,
  labels,
  showMinMax = false,
}: SparklineChartProps) {
  if (!data.length) return null;

  // Calculate dimensions
  const padding = showDots ? 4 : 2;
  const chartHeight = height - padding * 2;
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  // Generate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = ((maxValue - value) / range) * chartHeight + padding;
    return { x, y, value };
  });

  // Generate path for line
  const linePath = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x}% ${point.y}`)
    .join(" ");

  // Generate path for area (closed path)
  const areaPath = `${linePath} L 100% ${height} L 0% ${height} Z`;

  // Find min/max indices
  const minIndex = data.indexOf(minValue);
  const maxIndex = data.indexOf(maxValue);

  return (
    <div className={cn("relative", className)}>
      <svg
        width={width === "full" ? "100%" : width}
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={color}
            fillOpacity={fillOpacity}
            className="transition-all duration-300"
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-300"
        />

        {/* Dots */}
        {showDots &&
          points.map((point, i) => (
            <circle
              key={i}
              cx={`${point.x}%`}
              cy={point.y}
              r={3}
              fill={color}
              className="transition-all duration-300"
            />
          ))}

        {/* Min/Max indicators */}
        {showMinMax && (
          <>
            <circle
              cx={`${points[minIndex].x}%`}
              cy={points[minIndex].y}
              r={4}
              fill="var(--color-error)"
              className="transition-all duration-300"
            />
            <circle
              cx={`${points[maxIndex].x}%`}
              cy={points[maxIndex].y}
              r={4}
              fill="var(--color-success)"
              className="transition-all duration-300"
            />
          </>
        )}
      </svg>

      {/* Labels */}
      {labels && labels.length > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {labels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Variant for cost trends (green/red based on direction)
export function CostSparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  const trend =
    data.length >= 2
      ? data[data.length - 1] - data[data.length - 2]
      : 0;
  const color =
    trend > 0 ? "var(--color-error)" : "var(--color-success)";

  return (
    <SparklineChart
      data={data}
      color={color}
      className={className}
      showArea={true}
      fillOpacity={0.1}
    />
  );
}

// Variant for activity/usage (always teal)
export function ActivitySparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  return (
    <SparklineChart
      data={data}
      color="var(--color-brand-teal)"
      className={className}
      showArea={true}
      fillOpacity={0.2}
    />
  );
}

export default SparklineChart;
