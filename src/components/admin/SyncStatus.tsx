"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/cards/GlassCard";
import { Button } from "@/components/ui/Button";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusData {
  last_sync: string | null;
  synced_at: string | null;
  counts: {
    agents_upserted?: number;
    tasks_upserted?: number;
    activities_inserted?: number;
  };
  message?: string;
  error?: string;
}

interface SyncStatusProps {
  className?: string;
  showManualSync?: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * SyncStatus - Shows last sync time and allows manual sync
 * 
 * Features:
 * - Displays last successful sync time
 * - Shows sync counts (agents, tasks, activities)
 * - Manual "Sync Now" button
 * - Error state display
 */
export function SyncStatus({ className, showManualSync = true }: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sync status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualSync = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Trigger a manual sync - the API will read from OpenClaw workspace
          manual: true,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Sync failed: ${res.status}`);
      }
      
      // Refresh status after sync
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <GlassCard variant="glass-1" padding="md" className={className}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading sync status...</span>
        </div>
      </GlassCard>
    );
  }

  const lastSyncDate = status?.last_sync ? new Date(status.last_sync) : null;
  const isStale = lastSyncDate && (Date.now() - lastSyncDate.getTime()) > 15 * 60 * 1000; // 15 minutes

  return (
    <GlassCard variant="glass-1" padding="md" className={className}>
      <div className="flex items-center justify-between">
        {/* Status info */}
        <div className="flex items-center gap-3">
          {/* Status icon */}
          {error ? (
            <XCircle className="w-5 h-5 text-error" />
          ) : isStale ? (
            <AlertCircle className="w-5 h-5 text-warning" />
          ) : lastSyncDate ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground" />
          )}
          
          {/* Status text */}
          <div>
            <p className="text-sm font-medium text-foreground">
              {error ? "Sync Error" : lastSyncDate ? "Last Sync" : "Never Synced"}
            </p>
            <p className={cn(
              "text-xs",
              error ? "text-error" : isStale ? "text-warning" : "text-muted-foreground"
            )}>
              {error || (lastSyncDate ? formatTimeAgo(lastSyncDate) : "No data available")}
            </p>
          </div>
        </div>

        {/* Sync counts (if available) */}
        {status?.counts && !error && (
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span>{status.counts.agents_upserted ?? 0} agents</span>
            <span>{status.counts.tasks_upserted ?? 0} tasks</span>
            <span>{status.counts.activities_inserted ?? 0} activities</span>
          </div>
        )}

        {/* Manual sync button */}
        {showManualSync && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={syncing}
            className="ml-4"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}

export default SyncStatus;
