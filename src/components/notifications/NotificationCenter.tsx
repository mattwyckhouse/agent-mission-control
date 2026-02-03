"use client";

import { useState, useCallback } from "react";
import { Bell, Check, X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/cards/GlassCard";
import { cn } from "@/lib/utils";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

const typeConfig: Record<NotificationType, {
  icon: typeof Info;
  color: string;
  bgColor: string;
}> = {
  info: {
    icon: Info,
    color: "text-brand-teal",
    bgColor: "bg-brand-teal/10",
  },
  success: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  error: {
    icon: AlertTriangle,
    color: "text-error",
    bgColor: "bg-error/10",
  },
};

/**
 * NotificationCenter - Dropdown notification panel
 * 
 * Features:
 * - Type-coded notifications (info/success/warning/error)
 * - Mark as read/unread
 * - Dismiss individual or all
 * - Action links
 */
export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClearAll,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-error rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <GlassCard
            variant="glass-2"
            padding="none"
            className={cn(
              "absolute right-0 top-full mt-2 z-50",
              "w-80 max-h-[70vh] overflow-hidden",
              "animate-in fade-in-0 zoom-in-95 duration-100"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "px-4 py-3 transition-colors",
                          !notification.read && "bg-muted/30"
                        )}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full",
                            "flex items-center justify-center",
                            config.bgColor
                          )}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm font-medium",
                                !notification.read ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {notification.title}
                              </p>
                              <button
                                onClick={() => onDismiss(notification.id)}
                                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(notification.timestamp)}
                              </span>
                              <div className="flex items-center gap-2">
                                {notification.actionUrl && (
                                  <a
                                    href={notification.actionUrl}
                                    className="text-xs text-brand-teal hover:underline"
                                  >
                                    {notification.actionLabel || "View"}
                                  </a>
                                )}
                                {!notification.read && (
                                  <button
                                    onClick={() => onMarkRead(notification.id)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
