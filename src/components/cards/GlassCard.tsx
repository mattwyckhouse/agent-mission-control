import { ReactNode, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "glass-1" | "glass-2" | "glass-3";
  glow?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  "aria-label"?: string;
}

/**
 * GlassCard - Base glass-morphism container
 * 
 * Features:
 * - Three glass opacity variants
 * - Optional teal glow effect
 * - Optional hover state with border highlight
 * - Configurable padding
 */
export function GlassCard({
  children,
  className,
  variant = "glass-2",
  glow = false,
  hover = false,
  padding = "md",
  onClick,
  "aria-label": ariaLabel,
}: GlassCardProps) {
  // Glass styles use CSS variables for theme-awareness
  const glassStyles = {
    "glass-1": "bg-glass-1",
    "glass-2": "bg-glass-2", 
    "glass-3": "bg-card/80",
  };

  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const isInteractive = !!onClick;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        "rounded-2xl",
        "backdrop-blur-[28px]",
        "border border-white/10",
        "shadow-[0px_12px_48px_rgba(0,0,0,0.32)]",
        "transition-all duration-200",
        
        // Glass variant
        glassStyles[variant],
        
        // Padding
        paddingStyles[padding],
        
        // Optional glow
        glow && "shadow-[0px_8px_16px_rgba(27,208,184,0.16),inset_0px_0px_4px_#1BD0B8]",
        
        // Optional hover
        hover && [
          "hover:border-[var(--color-brand-teal)]/50",
          "hover:shadow-[0px_8px_16px_rgba(0,0,0,0.25)]",
          "cursor-pointer",
        ],
        
        // Focus states for interactive cards
        isInteractive && [
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--color-brand-teal)]",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[var(--color-iron-950)]",
        ],
        
        className
      )}
    >
      {children}
    </div>
  );
}

export default GlassCard;
