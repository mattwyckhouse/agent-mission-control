import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Page title and actions area
 * 
 * Used at the top of each page to show:
 * - Page title
 * - Optional subtitle
 * - Optional timestamp
 * - Optional action buttons
 */
export function PageHeader({
  title,
  subtitle,
  timestamp,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {timestamp && (
          <div className="hidden sm:block text-right">
            <p className="text-sm text-muted-foreground">{timestamp}</p>
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
