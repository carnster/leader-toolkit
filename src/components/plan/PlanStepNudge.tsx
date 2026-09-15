import { Sparkles } from "lucide-react";
import type { PlanCounts, PlanStep } from "@/lib/planSteps";

interface PlanStepNudgeProps {
  step: PlanStep;
  counts: PlanCounts;
}

export function PlanStepNudge({ step, counts }: PlanStepNudgeProps) {
  return (
    <div className="mt-6 flex gap-3 rounded-lg border border-[hsl(var(--stage-plan))]/25 bg-[hsl(var(--stage-plan))]/5 p-4">
      <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--stage-plan))]" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--stage-plan))]">Coach note</p>
        <p className="text-sm text-muted-foreground mt-1">{step.nudge(counts)}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Want more? Open the Implementation Coach and ask about this step.
        </p>
      </div>
    </div>
  );
}
