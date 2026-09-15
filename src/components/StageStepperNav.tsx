import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  number: number;
  title: string;
  completed: boolean;
  /** Strengthens-the-plan steps render with a dashed ring and an "optional" tag */
  optional?: boolean;
}

interface StageStepperNavProps {
  currentStep: number;
  steps: StepperStep[];
  onStepClick: (step: number) => void;
  stage: "decide" | "plan" | "implement" | "sustain";
  heading: string;
  helperText: string;
}

const ACCENT = {
  decide: {
    line: "bg-[hsl(var(--stage-decide))]",
    ring: "border-[hsl(var(--stage-decide))]",
    fill: "bg-[hsl(var(--stage-decide))]",
    fillSoft: "bg-[hsl(var(--stage-decide))]/10",
    text: "text-[hsl(var(--stage-decide))]",
    panel: "bg-[hsl(var(--stage-decide))]/5 border-[hsl(var(--stage-decide))]/25",
  },
  plan: {
    line: "bg-[hsl(var(--stage-plan))]",
    ring: "border-[hsl(var(--stage-plan))]",
    fill: "bg-[hsl(var(--stage-plan))]",
    fillSoft: "bg-[hsl(var(--stage-plan))]/10",
    text: "text-[hsl(var(--stage-plan))]",
    panel: "bg-[hsl(var(--stage-plan))]/5 border-[hsl(var(--stage-plan))]/25",
  },
  implement: {
    line: "bg-[hsl(var(--stage-implement))]",
    ring: "border-[hsl(var(--stage-implement))]",
    fill: "bg-[hsl(var(--stage-implement))]",
    fillSoft: "bg-[hsl(var(--stage-implement))]/10",
    text: "text-[hsl(var(--stage-implement))]",
    panel: "bg-[hsl(var(--stage-implement))]/5 border-[hsl(var(--stage-implement))]/25",
  },
  sustain: {
    line: "bg-[hsl(var(--stage-sustain))]",
    ring: "border-[hsl(var(--stage-sustain))]",
    fill: "bg-[hsl(var(--stage-sustain))]",
    fillSoft: "bg-[hsl(var(--stage-sustain))]/10",
    text: "text-[hsl(var(--stage-sustain))]",
    panel: "bg-[hsl(var(--stage-sustain))]/5 border-[hsl(var(--stage-sustain))]/25",
  },
} as const;

export function StageStepperNav({ currentStep, steps, onStepClick, stage, heading, helperText }: StageStepperNavProps) {
  const a = ACCENT[stage];
  const current = steps.find((s) => s.number === currentStep);
  const lineWidth = steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;

  return (
    <div className="w-full bg-card border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{heading}</h3>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-0 md:min-w-[34rem]">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted hidden md:block" />
          <div
            className={cn("absolute top-5 left-0 h-0.5 transition-all duration-300 hidden md:block", a.line)}
            style={{ width: `${Math.max(0, Math.min(100, lineWidth))}%` }}
          />

          <div className="relative flex flex-wrap gap-y-4 justify-between md:flex-nowrap">
            {steps.map((step) => {
              const isCurrent = step.number === currentStep;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => onStepClick(step.number)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all",
                    isCurrent ? "scale-105" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-background",
                      step.optional && !isCurrent && !step.completed && "border-dashed",
                      isCurrent && cn(a.ring, a.fill, "text-white"),
                      step.completed && !isCurrent && cn(a.ring, a.fillSoft),
                      !step.completed && !isCurrent && "border-muted"
                    )}
                  >
                    {step.completed && !isCurrent ? (
                      <CheckCircle2 className={cn("h-5 w-5", a.text)} />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="text-center max-w-[100px]">
                    <p className={cn("text-xs font-medium transition-colors", isCurrent ? a.text : "text-muted-foreground")}>
                      {step.title}
                    </p>
                    {step.optional && (
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">optional</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cn("mt-6 p-4 rounded-lg border", a.panel)}>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Current Step:</span> {current?.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      </div>
    </div>
  );
}
