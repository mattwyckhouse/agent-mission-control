"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

// ----- Types -----

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// ----- Context -----

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ----- Toast Provider -----

interface ToastProviderProps {
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = "top-right",
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Limit to maxToasts
        return updated.slice(0, maxToasts);
      });

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [maxToasts, removeToast]
  );

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div
        className={cn(
          "fixed z-[999] flex flex-col gap-2 pointer-events-none",
          positionClasses[position]
        )}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ----- Individual Toast Item -----

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Match animation duration
  }, [onDismiss]);

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      bgClass: "bg-[#1BD0B8]/10 border-[#1BD0B8]/30",
      iconClass: "text-[#1BD0B8]",
    },
    error: {
      icon: AlertCircle,
      bgClass: "bg-red-500/10 border-red-500/30",
      iconClass: "text-red-400",
    },
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-[#F27229]/10 border-[#F27229]/30",
      iconClass: "text-[#F27229]",
    },
    info: {
      icon: Info,
      bgClass: "bg-blue-500/10 border-blue-500/30",
      iconClass: "text-blue-400",
    },
  };

  const { icon: Icon, bgClass, iconClass } = typeConfig[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-lg",
        "border backdrop-blur-xl shadow-lg",
        "min-w-[300px] max-w-[420px]",
        "transform transition-all duration-200",
        isExiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-5",
        bgClass
      )}
    >
      {/* Icon */}
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconClass)} />

      {/* Message */}
      <p className="flex-1 text-sm text-[var(--color-iron-25)] leading-relaxed">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={cn(
          "flex-shrink-0 p-1 rounded-md",
          "text-[var(--color-iron-400)] hover:text-[var(--color-iron-25)]",
          "hover:bg-white/10 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-white/20"
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ----- Convenience Hooks -----

export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (message: string, duration?: number) =>
      addToast(message, "success", duration),
    error: (message: string, duration?: number) =>
      addToast(message, "error", duration),
    warning: (message: string, duration?: number) =>
      addToast(message, "warning", duration),
    info: (message: string, duration?: number) =>
      addToast(message, "info", duration),
  };
}

export default ToastProvider;
