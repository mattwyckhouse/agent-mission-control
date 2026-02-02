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
    "text-[var(--color-iron-400)]",
    "hover:text-[var(--color-iron-25)] hover:bg-white/5",
    "active:bg-white/10"
  ),
  ghost: cn(
    "text-[var(--color-iron-500)]",
    "hover:text-[var(--color-iron-25)]",
    "active:text-[var(--color-iron-100)]"
  ),
  danger: cn(
    "text-[var(--color-iron-400)]",
    "hover:text-[var(--color-error)] hover:bg-[rgba(222,94,87,0.1)]",
    "active:bg-[rgba(222,94,87,0.15)]"
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-iron-950)]",
          
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          iconSizeStyles[size],
          
          // Active state
          active && "text-[var(--color-brand-teal)]",
          
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
