"use client";

import { useState, useCallback, useEffect } from "react";
import type { Notification, NotificationType } from "@/components/notifications";

interface UseNotificationsOptions {
  /** Maximum notifications to keep */
  maxNotifications?: number;
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Storage key for persistence */
  storageKey?: string;
}

/**
 * useNotifications - Hook for managing notification state
 * 
 * Features:
 * - Add/remove notifications
 * - Mark as read
 * - Local storage persistence
 * - Auto-dismiss
 */
export function useNotifications({
  maxNotifications = 50,
  autoDismissMs = 0,
  storageKey = "mission-control-notifications",
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  // Save to storage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // Ignore storage errors
    }
  }, [notifications, storageKey]);

  // Add notification
  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-dismiss
    if (autoDismissMs > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, autoDismissMs);
    }

    return id;
  }, [maxNotifications, autoDismissMs]);

  // Mark as read
  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Dismiss notification
  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Convenience methods
  const info = useCallback((title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => 
    addNotification("info", title, message, options), [addNotification]);
  
  const success = useCallback((title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => 
    addNotification("success", title, message, options), [addNotification]);
  
  const warning = useCallback((title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => 
    addNotification("warning", title, message, options), [addNotification]);
  
  const error = useCallback((title: string, message: string, options?: { actionUrl?: string; actionLabel?: string }) => 
    addNotification("error", title, message, options), [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    // Convenience methods
    info,
    success,
    warning,
    error,
  };
}

export default useNotifications;
