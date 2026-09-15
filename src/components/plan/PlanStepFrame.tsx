import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StageStepperNav } from "@/components/StageStepperNav";
import { PlanStepNudge } from "@/components/plan/PlanStepNudge";
import {
  PLAN_STEPS,
  isStepComplete,
  stepByNumber,
  type PlanCounts,
  type PlanStep,
  type PlanStepId,
} from "@/lib/planSteps";
import { wasTemplatePrefilled } from "@/lib/templateHandoff";

interface PlanStepFrameProps {
  step: PlanStep;
  counts: PlanCounts;
  initiativeId: string;
  onGoToStep: (id: PlanStepId) => void;
  onReviewReadiness: () => void;
  children: ReactNode;
}

export function PlanStepFrame({ step, counts, initiativeId, onGoToStep, onReviewReadiness, children }: PlanStepFrameProps) {
  const prev = stepByNumber(step.number - 1);
  const next = stepByNumber(step.number + 1);
  const done = isStepComplete(step, counts);
  const showPrefilled = step.id === "ingredients" && counts.ingredients > 0 && wasTemplatePrefilled(initiativeId);

  return (
    <div>
      <StageStepperNav
        stage="plan"
        heading="Plan & Prepare, step by step"
        helperText="Work through the steps in order. Required steps unlock Implement. Optional steps make the plan stronger. You can jump between steps at any time."
        currentStep={step.number}
        steps={PLAN_STEPS.map((s) => ({
          number: s.number,
          title: s.title,
          completed: isStepComplete(s, counts),
          optional: s.tier === "strengthens",
        }))}
        onStepClick={(n) => {
          const target = stepByNumber(n);
          if (target) onGoToStep(target.id);
        }}
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step {step.number} of {PLAN_STEPS.length}
          </span>
          {step.tier === "required" ? (
            <Badge className="bg-[hsl(var(--stage-plan))] hover:bg-[hsl(var(--stage-plan))]">Required before Implement</Badge>
          ) : (
            <Badge variant="outline">Strengthens your plan</Badge>
          )}
          {done && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Started
            </Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold">{step.title}</h2>
        <p className="text-sm text-muted-foreground">
          {step.label}. {step.why}
        </p>
        {showPrefilled && (
          <div className="mt-3 flex gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-muted-foreground">
              Pre-filled from your template. Review each ingredient and adjust it to your school before moving on.
            </p>
          </div>
        )}
      </div>

      {children}

      <PlanStepNudge step={step} counts={counts} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <div>
          {prev ? (
            <Button variant="outline" onClick={() => onGoToStep(prev.id)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Previous: {prev.title}
            </Button>
          ) : (
            <Button variant="outline" onClick={onReviewReadiness} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to overview
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
            <Button onClick={onReviewReadiness} className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Review readiness
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
