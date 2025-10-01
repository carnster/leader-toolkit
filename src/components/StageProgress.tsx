import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  completed: boolean;
  current: boolean;
}

interface StageProgressProps {
  stages: Stage[];
}

export function StageProgress({ stages }: StageProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  stage.completed
                    ? "border-success bg-success text-success-foreground"
                    : stage.current
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/25 bg-background text-muted-foreground"
                )}
              >
                {stage.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  stage.current
                    ? "text-foreground"
                    : stage.completed
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              >
                {stage.name}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-[2px] flex-1 transition-colors",
                  stage.completed ? "bg-success" : "bg-muted-foreground/25"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
