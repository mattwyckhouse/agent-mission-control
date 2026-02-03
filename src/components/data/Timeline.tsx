"use client"

import { cn } from "@/lib/utils"

export type TimelineItemStatus = "done" | "active" | "pending" | "error"

export interface TimelineItem {
  id: string
  timestamp: string
  description: string
  status: TimelineItemStatus
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
  maxItems?: number
}

const statusIcons: Record<TimelineItemStatus, { icon: string; className: string }> = {
  done: { 
    icon: "✓", 
    className: "text-success" 
  },
  active: { 
    icon: "●", 
    className: "text-brand-orange animate-pulse" 
  },
  pending: { 
    icon: "○", 
    className: "text-muted-foreground" 
  },
  error: { 
    icon: "✕", 
    className: "text-error" 
  },
}

export function Timeline({ items, className, maxItems }: TimelineProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  return (
    <div
      className={cn(
        "border-l-2 border-border pl-3 ml-1",
        className
      )}
    >
      {displayItems.map((item) => (
        <TimelineRow key={item.id} item={item} />
      ))}
      {maxItems && items.length > maxItems && (
        <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <span className="w-12 tabular-nums">...</span>
          <span className="w-4" />
          <span>+{items.length - maxItems} more</span>
        </div>
      )}
    </div>
  )
}

interface TimelineRowProps {
  item: TimelineItem
}

function TimelineRow({ item }: TimelineRowProps) {
  const { icon, className: iconClassName } = statusIcons[item.status]

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="w-12 text-xs text-muted-foreground tabular-nums shrink-0">
        {item.timestamp}
      </span>
      <span className={cn("w-4 text-sm shrink-0", iconClassName)}>
        {icon}
      </span>
      <span className="text-sm text-foreground flex-1">
        {item.description}
      </span>
    </div>
  )
}

// Compact variant for agent detail pages
interface CompactTimelineProps {
  items: TimelineItem[]
  className?: string
}

export function CompactTimeline({ items, className }: CompactTimelineProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {items.map((item) => {
        const { icon, className: iconClassName } = statusIcons[item.status]
        return (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span className={cn("w-3", iconClassName)}>{icon}</span>
            <span className="text-muted-foreground tabular-nums">{item.timestamp}</span>
            <span className="text-muted-foreground truncate">{item.description}</span>
          </div>
        )
      })}
    </div>
  )
}
