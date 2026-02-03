import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "default" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  "aria-label": string;
}

const variantStyles = {
  default: cn(
    "text-muted-foreground",
    "hover:text-foreground hover:bg-accent",
    "active:bg-accent/80"
  ),
  ghost: cn(
    "text-muted-foreground",
    "hover:text-foreground",
    "active:text-foreground/80"
  ),
  danger: cn(
    "text-muted-foreground",
    "hover:text-error hover:bg-error/10",
    "active:bg-error/15"
  ),
};

const sizeStyles = {
  sm: "w-8 h-8",
  md: "w-11 h-11",
  lg: "w-12 h-12",
};

const iconSizeStyles = {
  sm: "[&>svg]:w-4 [&>svg]:h-4",
  md: "[&>svg]:w-5 [&>svg]:h-5",
  lg: "[&>svg]:w-6 [&>svg]:h-6",
};

/**
 * IconButton - Icon-only button for actions
 * 
 * Features:
 * - Three variants: default, ghost, danger
 * - Three sizes matching touch target specs
 * - Active state for toggles
 * - Required aria-label for accessibility
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      variant = "default",
      size = "md",
      active = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "rounded-lg",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          iconSizeStyles[size],
          
          // Active state
          active && "text-brand-teal",
          
          // Disabled state
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
