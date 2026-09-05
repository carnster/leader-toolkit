import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { stageProgress, type StageStep } from "@/lib/stageSteps";

interface StageProgressHeaderProps {
  stageName: string;
  steps: StageStep[];
  done: Record<string, boolean>;
  onGoToStep: (id: string) => void;
  /** Shown instead of Next-step when every required step is done */
  finalLabel?: string;
  onFinal?: () => void;
}

export function StageProgressHeader({ stageName, steps, done, onGoToStep, finalLabel, onFinal }: StageProgressHeaderProps) {
  const p = stageProgress(steps, done);
  const optionalCount = p.totalSteps - p.requiredTotal;
  return (
    <div className="rounded-lg border bg-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold">
            {stageName}: {p.completedSteps} of {p.totalSteps} steps complete
          </p>
          <p className="text-xs text-muted-foreground">
            {p.requiredDone} of {p.requiredTotal} required steps done.
            {optionalCount > 0 ? " The rest strengthen the work but do not block you." : ""}
          </p>
        </div>
        {p.isReady && finalLabel && onFinal ? (
          <Button onClick={onFinal} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {finalLabel}
          </Button>
        ) : p.nextStep ? (
          <Button onClick={() => onGoToStep(p.nextStep!.id)} className="gap-2">
            <Compass className="h-4 w-4" />
            Next step: {p.nextStep.number}. {p.nextStep.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Progress value={p.percent} className="h-2" />
    </div>
  );
}
