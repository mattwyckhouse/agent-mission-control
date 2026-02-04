/**
 * Budget Check API — Check costs against thresholds
 * 
 * POST /api/alerts/check — Check current usage against budget thresholds
 * 
 * This endpoint is designed to be called by:
 * - Cron jobs (periodic checks)
 * - OpenClaw webhooks (after cost updates)
 * - Manual triggers
 * 
 * Returns any alerts that should be triggered.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCostSummary,
  generateMockUsageData,
  type OpenClawUsageEntry,
} from "@/lib/openclaw/costs";

interface BudgetThreshold {
  daily?: number;
  weekly?: number;
  monthly?: number;
}

interface AlertSettings {
  global_budget: BudgetThreshold;
  agent_budgets: Record<string, BudgetThreshold>;
  notifications: {
    email?: boolean;
    webhook?: boolean;
    dashboard?: boolean;
  };
  warning_percentage: number;
  enabled: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  global_budget: {
    daily: 10.00,
    weekly: 50.00,
    monthly: 150.00,
  },
  agent_budgets: {},
  notifications: {
    email: false,
    webhook: true,
    dashboard: true,
  },
  warning_percentage: 80,
  enabled: true,
};

interface TriggeredAlert {
  type: "budget_exceeded" | "budget_warning";
  severity: "warning" | "critical";
  title: string;
  message: string;
  period: "daily" | "weekly" | "monthly";
  agent_id?: string;
  threshold: number;
  current_value: number;
  percentage: number;
}

// POST — Check budgets and trigger alerts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dry_run = false } = body;

    const supabase = await createClient();

    // 1. Get alert settings
    let settings = DEFAULT_SETTINGS;
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "alert_settings")
        .single();
      if (data) {
        const record = data as { value: unknown };
        settings = record.value as AlertSettings;
      }
    } catch {
      // Use defaults
    }

    if (!settings.enabled) {
      return NextResponse.json({
        checked: false,
        reason: "Alerts are disabled",
        alerts: [],
      });
    }

    // 2. Get current cost data
    // Try real data first, fall back to mock
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .in("activity_type", ["agent_action", "session_completed"])
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    let usageEntries: OpenClawUsageEntry[];
    if (!activities || activities.length === 0) {
      usageEntries = generateMockUsageData(30);
    } else {
      usageEntries = activities
        .filter((a: Record<string, unknown>) => {
          const meta = a.metadata as Record<string, unknown> | undefined;
          return meta?.inputTokens || meta?.input_tokens;
        })
        .map((a: Record<string, unknown>) => {
          const meta = a.metadata as Record<string, unknown>;
          return {
            sessionKey: (meta?.sessionKey as string) || `agent:${a.agent_id}:main`,
            agentId: (a.agent_id as string) || "unknown",
            model: (meta?.model as string) || "default",
            inputTokens: (meta?.inputTokens as number) || (meta?.input_tokens as number) || 0,
            outputTokens: (meta?.outputTokens as number) || (meta?.output_tokens as number) || 0,
            timestamp: a.created_at as string,
          };
        });
      if (usageEntries.length === 0) {
        usageEntries = generateMockUsageData(30);
      }
    }

    // 3. Calculate costs for different periods
    const dailySummary = calculateCostSummary(usageEntries, "day");
    const weeklySummary = calculateCostSummary(usageEntries, "week");
    const monthlySummary = calculateCostSummary(usageEntries, "month");

    // 4. Check against thresholds
    const triggeredAlerts: TriggeredAlert[] = [];
    const warningPercent = settings.warning_percentage / 100;

    // Check global budgets
    const checkBudget = (
      current: number,
      threshold: number | undefined,
      period: "daily" | "weekly" | "monthly",
      agentId?: string
    ) => {
      if (!threshold) return;

      const percentage = (current / threshold) * 100;
      const agentLabel = agentId ? ` for ${agentId}` : "";

      if (current >= threshold) {
        triggeredAlerts.push({
          type: "budget_exceeded",
          severity: "critical",
          title: `${period.charAt(0).toUpperCase() + period.slice(1)} Budget Exceeded${agentLabel}`,
          message: `${period.charAt(0).toUpperCase() + period.slice(1)} spending ($${current.toFixed(2)}) has exceeded the budget of $${threshold.toFixed(2)}${agentLabel}.`,
          period,
          agent_id: agentId,
          threshold,
          current_value: current,
          percentage,
        });
      } else if (current >= threshold * warningPercent) {
        triggeredAlerts.push({
          type: "budget_warning",
          severity: "warning",
          title: `${period.charAt(0).toUpperCase() + period.slice(1)} Budget Warning${agentLabel}`,
          message: `${period.charAt(0).toUpperCase() + period.slice(1)} spending ($${current.toFixed(2)}) has reached ${percentage.toFixed(0)}% of the $${threshold.toFixed(2)} budget${agentLabel}.`,
          period,
          agent_id: agentId,
          threshold,
          current_value: current,
          percentage,
        });
      }
    };

    // Global checks
    checkBudget(dailySummary.totalCost, settings.global_budget.daily, "daily");
    checkBudget(weeklySummary.totalCost, settings.global_budget.weekly, "weekly");
    checkBudget(monthlySummary.totalCost, settings.global_budget.monthly, "monthly");

    // Per-agent checks
    for (const [agentId, budget] of Object.entries(settings.agent_budgets)) {
      const agentDaily = dailySummary.byAgent.find(a => a.agentId === agentId);
      const agentWeekly = weeklySummary.byAgent.find(a => a.agentId === agentId);
      const agentMonthly = monthlySummary.byAgent.find(a => a.agentId === agentId);

      if (agentDaily) checkBudget(agentDaily.cost, budget.daily, "daily", agentId);
      if (agentWeekly) checkBudget(agentWeekly.cost, budget.weekly, "weekly", agentId);
      if (agentMonthly) checkBudget(agentMonthly.cost, budget.monthly, "monthly", agentId);
    }

    // 5. Store alerts (unless dry run)
    const storedAlerts = [];
    if (!dry_run && triggeredAlerts.length > 0) {
      for (const alert of triggeredAlerts) {
        // Check if we already have a recent alert for this same issue
        const { data: existingRaw } = await supabase
          .from("messages")
          .select("id, metadata")
          .eq("message_type", "escalation")
          .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
          .limit(10);

        const existing = existingRaw as Array<{ id: string; metadata: Record<string, unknown> }> | null;

        // Skip if we already alerted recently for same type
        const recentAlert = existing?.find(e => {
          const meta = e.metadata;
          return meta?.alert_type === alert.type &&
                 meta?.period === alert.period &&
                 meta?.agent_id === alert.agent_id;
        })?.metadata;
        if (recentAlert) {
          continue; // Skip duplicate - already alerted for this recently
        }

        // Store the alert
        const { data, error } = await supabase
          .from("messages")
          .insert({
            from_agent_id: null,
            to_agent_id: null,
            from_human: false,
            to_human: true,
            content: alert.message,
            message_type: "escalation",
            metadata: {
              alert_type: alert.type,
              severity: alert.severity,
              title: alert.title,
              period: alert.period,
              agent_id: alert.agent_id,
              threshold: alert.threshold,
              current_value: alert.current_value,
              percentage: alert.percentage,
              acknowledged: false,
              source: "budget_check",
            },
          } as never)
          .select()
          .single();

        if (!error && data) {
          storedAlerts.push(data);
        }
      }
    }

    return NextResponse.json({
      checked: true,
      timestamp: new Date().toISOString(),
      dry_run,
      costs: {
        daily: dailySummary.totalCost,
        weekly: weeklySummary.totalCost,
        monthly: monthlySummary.totalCost,
      },
      thresholds: {
        daily: settings.global_budget.daily,
        weekly: settings.global_budget.weekly,
        monthly: settings.global_budget.monthly,
      },
      alerts_triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
      stored: storedAlerts.length,
    });
  } catch (err) {
    console.error("Budget check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — Simple health check / status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/alerts/check",
    description: "POST to check current usage against budget thresholds",
    options: {
      dry_run: "boolean - if true, don't store alerts, just return what would trigger",
    },
  });
}
