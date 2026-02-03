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
    "bg-foreground text-background",
    "hover:bg-foreground/90",
    "active:bg-foreground/80"
  ),
  secondary: cn(
    "bg-transparent text-foreground",
    "border border-border",
    "hover:bg-accent",
    "active:bg-accent/80"
  ),
  ghost: cn(
    "bg-transparent text-muted-foreground",
    "hover:text-foreground hover:bg-accent",
    "active:bg-accent/80"
  ),
  danger: cn(
    "bg-error text-white",
    "hover:bg-error/90",
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          
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
