"use client";

import { cn } from "@/lib/utils";
import { Check, X, Loader2, Circle } from "lucide-react";

export type RalphPhase = "interview" | "plan" | "build" | "done" | "blocked";

type PhaseState = "pending" | "active" | "complete" | "failed";

interface RalphPhasesProps {
  currentPhase: RalphPhase;
  className?: string;
}

const PHASES: { key: RalphPhase; label: string }[] = [
  { key: "interview", label: "INTERVIEW" },
  { key: "plan", label: "PLAN" },
  { key: "build", label: "BUILD" },
  { key: "done", label: "DONE" },
];

function getPhaseState(phase: RalphPhase, currentPhase: RalphPhase): PhaseState {
  if (currentPhase === "blocked") {
    // When blocked, mark the current step as failed
    const blockablePhases: RalphPhase[] = ["interview", "plan", "build"];
    const currentIndex = blockablePhases.indexOf(currentPhase);
    const phaseIndex = PHASES.findIndex(p => p.key === phase);
    
    if (phaseIndex < currentIndex) return "complete";
    if (phase === "done") return "pending";
    return "failed";
  }

  const phaseOrder: RalphPhase[] = ["interview", "plan", "build", "done"];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const phaseIndex = phaseOrder.indexOf(phase);

  if (phaseIndex < currentIndex) return "complete";
  if (phaseIndex === currentIndex) return currentPhase === "done" ? "complete" : "active";
  return "pending";
}

function PhaseIcon({ state }: { state: PhaseState }) {
  switch (state) {
    case "complete":
      return <Check className="w-4 h-4" />;
    case "active":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "failed":
      return <X className="w-4 h-4" />;
    case "pending":
    default:
      return <Circle className="w-4 h-4" />;
  }
}

function PhaseBox({
  phase,
  state,
}: {
  phase: { key: RalphPhase; label: string };
  state: PhaseState;
}) {
  return (
    <div
      className={cn(
        "w-[100px] p-3 text-center rounded-lg",
        "bg-glass-1 border transition-all duration-200",
        // Border colors based on state
        state === "complete" && "border-brand-teal shadow-[0_0_8px_rgba(27,208,184,0.3)]",
        state === "active" && "border-brand-orange animate-pulse",
        state === "failed" && "border-error",
        state === "pending" && "border-muted"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center mb-1",
          state === "complete" && "text-brand-teal",
          state === "active" && "text-brand-orange",
          state === "failed" && "text-error",
          state === "pending" && "text-muted-foreground"
        )}
      >
        <PhaseIcon state={state} />
      </div>
      <div
        className={cn(
          "text-xs font-heading font-semibold tracking-wide",
          state === "complete" && "text-brand-teal",
          state === "active" && "text-brand-orange",
          state === "failed" && "text-error",
          state === "pending" && "text-muted-foreground"
        )}
      >
        {phase.label}
      </div>
    </div>
  );
}

function ArrowConnector({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        "w-6 h-0.5 transition-colors duration-200",
        filled ? "bg-brand-teal" : "bg-muted"
      )}
    />
  );
}

export function RalphPhases({ currentPhase, className }: RalphPhasesProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {PHASES.map((phase, index) => {
        const state = getPhaseState(phase.key, currentPhase);
        const isComplete = state === "complete";
        
        return (
          <div key={phase.key} className="flex items-center gap-1">
            <PhaseBox phase={phase} state={state} />
            {index < PHASES.length - 1 && (
              <ArrowConnector filled={isComplete} />
            )}
          </div>
        );
      })}
    </div>
  );
}
