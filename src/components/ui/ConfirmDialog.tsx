"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant affects confirm button style */
  variant?: "default" | "danger";
  /** Whether an action is in progress */
  loading?: boolean;
  /** Icon to show (defaults based on variant) */
  icon?: React.ReactNode;
}

/**
 * ConfirmDialog - Modal confirmation dialog
 * 
 * Features:
 * - Accessible modal with focus trap
 * - Keyboard navigation (Escape to close)
 * - Loading state for async confirmations
 * - Danger variant for destructive actions
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the dialog
      dialogRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
      
      // Restore focus
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !loading) {
      onClose();
    }
  }, [loading, onClose]);

  // Click outside to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  }, [loading, onClose]);

  if (!isOpen) return null;

  const defaultIcon = variant === "danger" 
    ? <AlertTriangle className="w-6 h-6 text-error" />
    : null;

  const displayIcon = icon ?? defaultIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-md",
          "bg-card rounded-xl shadow-2xl",
          "border border-border",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-teal/50",
            loading && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4">
            {displayIcon && (
              <div className="flex-shrink-0 mt-0.5">
                {displayIcon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2
                id="confirm-dialog-title"
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-2 text-sm text-muted-foreground"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === "danger" ? "ghost" : "secondary"}
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                variant === "danger" && "text-error hover:text-error hover:bg-error/10"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
