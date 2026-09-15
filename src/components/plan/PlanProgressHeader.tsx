import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PlanProgress, PlanStepId } from "@/lib/planSteps";

interface PlanProgressHeaderProps {
  progress: PlanProgress;
  onGoToStep: (id: PlanStepId) => void;
  onReviewReadiness: () => void;
}

export function PlanProgressHeader({ progress, onGoToStep, onReviewReadiness }: PlanProgressHeaderProps) {
  const { completedSteps, totalSteps, requiredDone, requiredTotal, percent, isReady, nextStep } = progress;

  return (
    <div className="rounded-lg border bg-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold">
            Plan &amp; Prepare: {completedSteps} of {totalSteps} steps complete
          </p>
          <p className="text-xs text-muted-foreground">
            {requiredDone} of {requiredTotal} required steps done. The rest strengthen your plan but do not block Implement.
          </p>
        </div>
        {isReady ? (
          <Button onClick={onReviewReadiness} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4" />
            You're ready. Review and move to Implement
          </Button>
        ) : nextStep ? (
          <Button onClick={() => onGoToStep(nextStep.id)} className="gap-2">
            <Compass className="h-4 w-4" />
            Next step: {nextStep.number}. {nextStep.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}
