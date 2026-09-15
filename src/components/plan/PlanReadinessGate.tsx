import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PLAN_STEPS, getPlanProgress, isStepComplete, type PlanCounts, type PlanStepId } from "@/lib/planSteps";

interface PlanReadinessGateProps {
  initiativeId: string;
  counts: PlanCounts;
  onGoToStep: (id: PlanStepId) => void;
}

export function PlanReadinessGate({ initiativeId, counts, onGoToStep }: PlanReadinessGateProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [moving, setMoving] = useState(false);
  const progress = getPlanProgress(counts);

  const moveToImplement = async () => {
    if (!initiativeId || !progress.isReady) return;
    setMoving(true);
    const { error } = await supabase.from("initiatives").update({ stage: "implement" }).eq("id", initiativeId);
    setMoving(false);
    if (error) {
      toast({ title: "Couldn't update the stage", description: error.message, variant: "destructive" });
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["initiatives"] }),
      queryClient.invalidateQueries({ queryKey: ["stage-completion", initiativeId] }),
    ]);
    toast({ title: "You're in the Implement stage", description: "Your plan is the blueprint. Now the work is training and coaching your team and watching fidelity." });
    navigate(`/implement?initiative=${initiativeId}`);
  };

  const renderRow = (id: PlanStepId) => {
    const step = PLAN_STEPS.find((s) => s.id === id)!;
    const done = isStepComplete(step, counts);
    return (
      <button
        key={step.id}
        type="button"
        onClick={() => onGoToStep(step.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted/50",
          done && "border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20"
        )}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1">
          <span className="font-medium">
            {step.number}. {step.title}
          </span>
          <span className="text-muted-foreground"> · {step.label}</span>
        </span>
        {!done && <span className="text-xs text-[hsl(var(--stage-plan))]">Go to step</span>}
      </button>
    );
  };

  return (
    <Card className={cn(progress.isReady && "border-green-600 bg-green-50/40 dark:bg-green-950/10")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className={cn("h-5 w-5", progress.isReady ? "text-green-600" : "text-primary")} />
          {progress.isReady ? "You're ready to implement" : "Ready to implement?"}
        </CardTitle>
        <CardDescription>
          {progress.isReady
            ? "Every required step has at least one entry. Moving to Implement marks this initiative as in progress across the toolkit."
            : `${progress.requiredDone} of ${progress.requiredTotal} required steps have an entry. Finish the unchecked ones below to unlock Implement.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Required before Implement</p>
          <div className="space-y-2">{PLAN_STEPS.filter((s) => s.tier === "required").map((s) => renderRow(s.id))}</div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Strengthens your plan (optional)</p>
          <div className="space-y-2">{PLAN_STEPS.filter((s) => s.tier === "strengthens").map((s) => renderRow(s.id))}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {progress.isReady
              ? "You can keep refining the optional steps after you move on."
              : "The button unlocks when every required step has at least one entry."}
          </p>
          <Button size="lg" onClick={moveToImplement} disabled={!progress.isReady || moving} className="gap-2">
            {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Move to Implement stage
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
