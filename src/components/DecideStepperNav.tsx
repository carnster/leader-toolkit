import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  completed: boolean;
}

interface DecideStepperNavProps {
  currentStep: number;
  steps: Step[];
  onStepClick: (step: number) => void;
}

export function DecideStepperNav({ currentStep, steps, onStepClick }: DecideStepperNavProps) {
  return (
    <div className="w-full bg-card border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Decide Stage Workflow</h3>
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </span>
      </div>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-[hsl(var(--stage-decide))] transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className={cn(
                "flex flex-col items-center gap-2 group transition-all",
                step.number === currentStep ? "scale-105" : "opacity-70 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-background",
                  step.number === currentStep && "border-[hsl(var(--stage-decide))] bg-[hsl(var(--stage-decide))] text-white",
                  step.completed && step.number !== currentStep && "border-[hsl(var(--stage-decide))] bg-[hsl(var(--stage-decide))]/10",
                  !step.completed && step.number !== currentStep && "border-muted"
                )}
              >
                {step.completed && step.number !== currentStep ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--stage-decide))]" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <div className="text-center max-w-[100px]">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors",
                    step.number === currentStep ? "text-[hsl(var(--stage-decide))]" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-[hsl(var(--stage-decide))]/5 rounded-lg border border-[hsl(var(--stage-decide))]/25">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Current Step:</span> {steps[currentStep - 1]?.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete each step to build your decision brief. You can navigate between steps at any time.
        </p>
      </div>
    </div>
  );
}
