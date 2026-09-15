import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StageStepperNav } from "@/components/StageStepperNav";
import { stepByNumber, type StageKey, type StageStep } from "@/lib/stageSteps";

interface StageStepFrameProps {
  stage: StageKey;
  stageName: string;
  steps: StageStep[];
  step: StageStep;
  done: Record<string, boolean>;
  onGoToStep: (id: string) => void;
  children: ReactNode;
  /** Rendered in place of Continue on the last step */
  footerFinal?: ReactNode;
  /** Optional coach note under the content */
  nudge?: string;
}

const ACCENT_BADGE: Record<StageKey, string> = {
  decide: "bg-[hsl(var(--stage-decide))] hover:bg-[hsl(var(--stage-decide))]",
  implement: "bg-[hsl(var(--stage-implement))] hover:bg-[hsl(var(--stage-implement))]",
  sustain: "bg-[hsl(var(--stage-sustain))] hover:bg-[hsl(var(--stage-sustain))]",
};

export function StageStepFrame({ stage, stageName, steps, step, done, onGoToStep, children, footerFinal, nudge }: StageStepFrameProps) {
  const prev = stepByNumber(steps, step.number - 1);
  const next = stepByNumber(steps, step.number + 1);
  const isDone = !!done[step.id];

  return (
    <div>
      <StageStepperNav
        stage={stage}
        heading={`${stageName}, step by step`}
        helperText="Work through the steps in order. Required steps move you to the next stage. Optional steps make the work stronger. You can jump between steps at any time."
        currentStep={step.number}
        steps={steps.map((s) => ({ number: s.number, title: s.title, completed: !!done[s.id], optional: s.tier === "strengthens" }))}
        onStepClick={(n) => {
          const target = stepByNumber(steps, n);
          if (target) onGoToStep(target.id);
        }}
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step {step.number} of {steps.length}
          </span>
          {step.tier === "required" ? (
            <Badge className={ACCENT_BADGE[stage]}>Required</Badge>
          ) : (
            <Badge variant="outline">Strengthens the work</Badge>
          )}
          {isDone && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Started
            </Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold">{step.title}</h2>
        <p className="text-sm text-muted-foreground">
          {step.label}. {step.why}
        </p>
      </div>

      <div className="space-y-8">{children}</div>

      {nudge && (
        <div className="mt-6 rounded-lg border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coach note</p>
          <p className="text-sm text-muted-foreground mt-1">{nudge}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <div>
          {prev && (
            <Button variant="outline" onClick={() => onGoToStep(prev.id)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Previous: {prev.title}
            </Button>
          )}
        </div>
        <div>
          {next ? (
            <Button onClick={() => onGoToStep(next.id)} className="gap-2">
              Continue: {next.title}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            footerFinal ?? null
          )}
        </div>
      </div>
    </div>
  );
}
