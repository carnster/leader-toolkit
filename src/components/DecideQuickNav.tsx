import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecideQuickNavProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  completionStatus: {
    [key: number]: boolean;
  };
}

const steps = [
  { number: 1, name: "Problem Definition", shortName: "Problem" },
  { number: 2, name: "Team Assembly", shortName: "Team" },
  { number: 3, name: "Goal Development", shortName: "Goals" },
  { number: 4, name: "Solution Selection", shortName: "Solution" },
  { number: 5, name: "Readiness & Feasibility", shortName: "Feasibility" },
  { number: 6, name: "Success Metrics", shortName: "Metrics" },
];

export function DecideQuickNav({ currentStep, onStepChange, completionStatus }: DecideQuickNavProps) {
  return (
    <Card className="p-4 sticky top-4">
      <h3 className="font-semibold text-sm mb-3">Quick Navigation</h3>
      <div className="space-y-1">
        {steps.map((step) => {
          const isComplete = completionStatus[step.number];
          const isCurrent = currentStep === step.number;
          
          return (
            <Button
              key={step.number}
              variant={isCurrent ? "default" : "ghost"}
              size="sm"
              onClick={() => onStepChange(step.number)}
              className={cn(
                "w-full justify-start text-left",
                isComplete && !isCurrent && "text-green-600 dark:text-green-400"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.number}.</span>
                    <span className="truncate">{step.shortName}</span>
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <p>{Object.values(completionStatus).filter(Boolean).length} of {steps.length} completed</p>
      </div>
    </Card>
  );
}