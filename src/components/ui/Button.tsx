import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantStyles = {
  primary: cn(
    "bg-[var(--color-iron-25)] text-[var(--color-iron-950)]",
    "hover:bg-[var(--color-iron-100)]",
    "active:bg-[var(--color-iron-200)]"
  ),
  secondary: cn(
    "bg-transparent text-[var(--color-iron-25)]",
    "border border-white/30",
    "hover:bg-white/5",
    "active:bg-white/10"
  ),
  ghost: cn(
    "bg-transparent text-[var(--color-iron-400)]",
    "hover:text-[var(--color-iron-25)] hover:bg-white/5",
    "active:bg-white/10"
  ),
  danger: cn(
    "bg-[var(--color-error)] text-white",
    "hover:bg-[var(--color-error-hover)]",
    "active:brightness-90"
  ),
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

/**
 * Button - Multi-variant button component
 * 
 * Features:
 * - Four variants: primary, secondary, ghost, danger
 * - Three sizes: sm, md, lg
 * - Optional icon with left/right positioning
 * - Full-width option
 * - Disabled state styling
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      children,
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
          "rounded-full font-medium",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-iron-950)]",
          
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          
          // Full width
          fullWidth && "w-full",
          
          // Disabled state
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
