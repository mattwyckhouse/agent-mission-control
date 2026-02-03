import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "glass-1" | "glass-2" | "glass-3";
  glow?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
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
}: GlassCardProps) {
  const glassStyles = {
    "glass-1": "bg-[rgba(17,18,20,0.24)]",
    "glass-2": "bg-[rgba(17,18,20,0.56)]",
    "glass-3": "bg-[rgba(17,18,20,0.80)]",
  };

  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
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
        
        className
      )}
    >
      {children}
    </div>
  );
}

export default GlassCard;
