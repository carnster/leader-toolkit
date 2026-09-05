import { useEffect, useState } from "react";
import { Link as LinkIcon, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Stage = "decide" | "explore" | "prepare" | "deliver" | "sustain";

interface ChecklistItem {
  id: string;
  text: string;
  category?: string;
  /** For stages with a numbered flow (Decide), the step this question belongs to */
  step?: number;
}

interface MasterChecklistProps {
  stage: Stage;
  initiativeId?: string;
  /** Items whose value is defined here are auto-checked from data and cannot be toggled by hand */
  autoCheckedItems?: Partial<Record<string, boolean>>;
  /** Rail layout: small card meant for a sticky sidebar */
  compact?: boolean;
  /** Called when a row (or its Step button) is clicked; used to jump to a step */
  onItemClick?: (item: { id: string; step?: number }) => void;
}

const STAGE_LABEL: Record<Stage, string> = {
  decide: "Decide",
  explore: "Explore",
  prepare: "Plan & Prepare",
  deliver: "Implement",
  sustain: "Spread & Sustain",
};

const CHECKLIST_ITEMS: Record<Stage, ChecklistItem[]> = {
  decide: [
    { id: "identified-need", step: 1, category: "Problem Definition", text: "Are we confident that we have identified the right student need(s) by drawing on a range of data and perspectives?" },
    { id: "team-assembled", step: 2, category: "Team", text: "Have we assembled an implementation team with diverse stakeholders and expertise?" },
    { id: "goals-defined", step: 3, category: "Goals", text: "Have we developed clear, measurable, time-bound goals for this initiative?" },
    { id: "evidence-approach", step: 4, category: "Solution Selection", text: "Have we selected an evidence-informed approach that meets student needs and is suitable for our setting?" },
    { id: "barriers-enablers", step: 5, category: "Readiness", text: "Are we aware of potential barriers and enablers to change in our setting?" },
    { id: "feasibility", step: 5, category: "Feasibility", text: "Is the approach feasible to implement given our resources, capacity, and context?" },
    { id: "success-metrics", step: 6, category: "Measurement", text: "Have we defined how we will measure progress and success, with leading and lagging indicators and a timeline?" },
  ],
  explore: [
    { id: "identified-need", category: "Problem Definition", text: "Are we confident that we have identified the right student need(s) by drawing on a range of data and perspectives?" },
    { id: "evidence-approach", category: "Solution Selection", text: "Have we selected an evidence-informed approach that meets student needs and is suitable for our setting?" },
    { id: "implementation-requirements", category: "Requirements", text: "What is needed to implement this particular programme or practice?" },
    { id: "barriers-enablers", category: "Readiness", text: "Are we aware of potential barriers and enablers to change in our setting?" },
    { id: "feasibility", category: "Feasibility", text: "Is the approach feasible to implement?" },
  ],
  prepare: [
    { id: "collaborative-planning", category: "Planning", text: "Have we conducted implementation planning collaboratively so that it unites understanding?" },
    { id: "shared-understanding", category: "Communication", text: "Is there a shared understanding of why the change is taking place, what it entails, and how it will be implemented?" },
    { id: "tailored-strategies", category: "Strategy", text: "Have we selected a tailored package of strategies to implement the approach and address implementation barriers?" },
    { id: "empowered-people", category: "Team", text: "Have we identified a range of people across the school and given them real authority to support the changes?" },
    { id: "systems-structures", category: "Infrastructure", text: "Are systems and structures in place to enable effective implementation?" },
    { id: "ongoing-learning", category: "Culture", text: "Is delivery of the approach treated as a process of ongoing learning and improvement?" },
  ],
  deliver: [
    { id: "monitoring-systems", category: "Monitoring", text: "Are systems in place to monitor implementation, identify barriers and enablers, and make improvements?" },
    { id: "leadership-support", category: "Support", text: "Do staff feel supported by the actions of leadership?" },
    { id: "reinforced-pd", category: "Development", text: "Is initial professional development being reinforced by follow-on support such as feedback, prompts, and reminders?" },
    { id: "protected-support", category: "Protection", text: "As new priorities emerge, is sufficient support in place to protect and maintain the implementation effort?" },
  ],
  sustain: [
    { id: "leadership-acknowledgment", category: "Leadership", text: "Do leaders continue to acknowledge and support good implementation practices?" },
    { id: "distributed-involvement", category: "Capacity", text: "Are a range of staff involved so that we aren't over-relying on individuals?" },
    { id: "reviewed-effort", category: "Evaluation", text: "Before deciding whether to continue, scale-up, or stop an approach, have we reviewed the previous implementation effort and outcomes achieved so far?" },
  ],
};

function storageKey(stage: Stage, initiativeId?: string) {
  return `stage-checklist:${stage}:${initiativeId ?? "none"}`;
}

function readManual(stage: Stage, initiativeId?: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(stage, initiativeId));
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function MasterChecklist({ stage, initiativeId, autoCheckedItems = {}, compact = false, onItemClick }: MasterChecklistProps) {
  const items = CHECKLIST_ITEMS[stage];
  const [manual, setManual] = useState<Record<string, boolean>>(() => readManual(stage, initiativeId));

  // Re-hydrate when the initiative changes (manual checks are per initiative)
  useEffect(() => {
    setManual(readManual(stage, initiativeId));
  }, [stage, initiativeId]);

  const isAuto = (id: string) => autoCheckedItems[id] !== undefined;
  const isChecked = (id: string) => (isAuto(id) ? !!autoCheckedItems[id] : !!manual[id]);

  const setManualChecked = (id: string, checked: boolean) => {
    const next = { ...manual, [id]: checked };
    setManual(next);
    try {
      localStorage.setItem(storageKey(stage, initiativeId), JSON.stringify(next));
    } catch {
      /* storage unavailable: keep in memory only */
    }
  };

  const checkedCount = items.filter((i) => isChecked(i.id)).length;
  const completionRate = (checkedCount / items.length) * 100;
  const autoCount = items.filter((i) => isAuto(i.id)).length;
  const label = STAGE_LABEL[stage];

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold">{label} checklist</h3>
          <span className="text-xs text-muted-foreground">
            {checkedCount} of {items.length}
          </span>
        </div>
        <Progress value={completionRate} className="h-1.5 mb-3" />
        <ul className="space-y-1.5">
          {items.map((item) => {
            const checked = isChecked(item.id);
            const auto = isAuto(item.id);
            const clickable = !!onItemClick && item.step !== undefined;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-2 rounded-md border p-2 text-left",
                  checked && "border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20"
                )}
                title={item.text}
              >
                {auto ? (
                  checked ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  <Checkbox
                    id={`${stage}-${item.id}`}
                    checked={checked}
                    onCheckedChange={(v) => setManualChecked(item.id, v === true)}
                    className="mt-0.5"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {auto ? (
                    <p className="text-xs font-medium leading-tight">{item.category}</p>
                  ) : (
                    <label htmlFor={`${stage}-${item.id}`} className="block cursor-pointer text-xs font-medium leading-tight">
                      {item.category}
                    </label>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{item.text}</p>
                </div>
                {clickable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 px-1.5 text-[11px]"
                    onClick={() => onItemClick?.({ id: item.id, step: item.step })}
                    aria-label={`Go to step ${item.step}`}
                  >
                    Step {item.step}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">
          {autoCount > 0 && autoCount === items.length
            ? "Items check themselves as you complete the steps."
            : autoCount > 0
            ? "Some items check themselves from your data. Tick the rest as you confirm them."
            : "Tick each item as you confirm it. Your checks are saved on this device."}
        </p>
        {completionRate === 100 && (
          <p className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-200">
            Checklist complete. You're ready for the next stage.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {label} Stage Checklist
            </CardTitle>
            <CardDescription>Reflection questions to guide this stage of implementation</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionRate} className="h-2" />
        <div className="space-y-3">
          {items.map((item) => {
            const auto = isAuto(item.id);
            return (
              <div key={item.id} className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <Checkbox
                  id={item.id}
                  checked={isChecked(item.id)}
                  onCheckedChange={(v) => !auto && setManualChecked(item.id, v === true)}
                  disabled={auto}
                  className="mt-0.5"
                />
                <label htmlFor={item.id} className="flex-1 cursor-pointer text-sm leading-relaxed">
                  {item.category && <span className="mr-2 text-xs font-medium text-primary">[{item.category}]</span>}
                  {item.text}
                </label>
                {onItemClick && item.step !== undefined && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onItemClick({ id: item.id, step: item.step })}>
                    <LinkIcon className="mr-1 h-3 w-3" /> Step {item.step}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {completionRate === 100 && (
          <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-success">
            <strong>Checklist complete.</strong> You're ready to progress to the next stage.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
