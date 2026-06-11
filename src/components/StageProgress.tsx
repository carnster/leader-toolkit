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

// Book-aligned display labels (Implement with IMPACT): four stages.
// The DB value 'monitor' is not a stage; it displays as part of Implement.
const STAGE_DISPLAY: Record<string, string> = {
  decide: "Decide",
  plan: "Plan & Prepare",
  implement: "Implement",
  monitor: "Implement",
  sustain: "Spread & Sustain",
};

// Collapse the legacy 5-stage sequence into the book's 4 stages:
// 'monitor' merges into 'implement' (an initiative in monitoring IS in the Implement stage).
function toDisplayStages(stages: Stage[]): Stage[] {
  const monitor = stages.find((s) => s.id === "monitor");
  return stages
    .filter((s) => s.id !== "monitor")
    .map((s) => {
      const name = STAGE_DISPLAY[s.id] ?? s.name;
      if (s.id === "implement" && monitor) {
        return {
          ...s,
          name,
          completed: s.completed && monitor.completed,
          current: s.current || monitor.current,
        };
      }
      return { ...s, name };
    });
}

export function StageProgress({ stages: rawStages }: StageProgressProps) {
  const stages = toDisplayStages(rawStages);
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
