import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface ChecklistItem {
  id: string;
  text: string;
  category?: string;
}

interface MasterChecklistProps {
  stage: "explore" | "prepare" | "deliver" | "sustain";
  initiativeId?: string;
  autoCheckedItems?: Record<string, boolean>;
}

const CHECKLIST_ITEMS = {
  explore: [
    {
      id: "identified-need",
      text: "Are we confident that we have identified the right pupil need(s) by drawing on a range of data and perspectives?",
      category: "Problem Definition"
    },
    {
      id: "evidence-approach",
      text: "Have we selected an evidence-informed approach that meets pupil needs and is suitable for our setting?",
      category: "Solution Selection"
    },
    {
      id: "implementation-requirements",
      text: "What is needed to implement this particular programme or practice?",
      category: "Requirements"
    },
    {
      id: "barriers-enablers",
      text: "Are we aware of potential barriers and enablers to change in our setting?",
      category: "Readiness"
    },
    {
      id: "feasibility",
      text: "Is the approach feasible to implement?",
      category: "Feasibility"
    }
  ],
  prepare: [
    {
      id: "collaborative-planning",
      text: "Have we conducted implementation planning collaboratively so that it unites understanding?",
      category: "Planning"
    },
    {
      id: "shared-understanding",
      text: "Is there a shared understanding of why the change is taking place, what it entails, and how it will be implemented?",
      category: "Communication"
    },
    {
      id: "tailored-strategies",
      text: "Have we selected a tailored package of strategies to implement the approach and address implementation barriers?",
      category: "Strategy"
    },
    {
      id: "empowered-people",
      text: "Have we identified and empowered a range of people across the school who can support the changes?",
      category: "Team"
    },
    {
      id: "systems-structures",
      text: "Are systems and structures in place to enable effective implementation?",
      category: "Infrastructure"
    },
    {
      id: "ongoing-learning",
      text: "Is delivery of the approach treated as a process of ongoing learning and improvement?",
      category: "Culture"
    }
  ],
  deliver: [
    {
      id: "monitoring-systems",
      text: "Are systems in place to monitor implementation, identify barriers and enablers, and make improvements?",
      category: "Monitoring"
    },
    {
      id: "leadership-support",
      text: "Do staff feel supported by the actions of leadership?",
      category: "Support"
    },
    {
      id: "reinforced-pd",
      text: "Is initial professional development being reinforced by follow-on support such as feedback, prompts, and reminders?",
      category: "Development"
    },
    {
      id: "protected-support",
      text: "As new priorities emerge, is sufficient support in place to protect and maintain the implementation effort?",
      category: "Protection"
    }
  ],
  sustain: [
    {
      id: "leadership-acknowledgment",
      text: "Do leaders continue to acknowledge and support good implementation practices?",
      category: "Leadership"
    },
    {
      id: "distributed-involvement",
      text: "Are a range of staff involved so that we aren't over-relying on individuals?",
      category: "Capacity"
    },
    {
      id: "reviewed-effort",
      text: "Before deciding whether to continue, scale-up, or stop an approach, have we reviewed the previous implementation effort and outcomes achieved so far?",
      category: "Evaluation"
    }
  ]
};

export function MasterChecklist({ stage, initiativeId, autoCheckedItems }: MasterChecklistProps) {
  const items = CHECKLIST_ITEMS[stage];
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Use auto-checked items if provided (for Decide stage), otherwise use manual checks
  const effectiveCheckedItems = autoCheckedItems || checkedItems;
  const completionRate = (Object.values(effectiveCheckedItems).filter(Boolean).length / items.length) * 100;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {stage.charAt(0).toUpperCase() + stage.slice(1)} Stage Checklist
            </CardTitle>
            <CardDescription>
              Reflection questions to guide this stage of implementation
            </CardDescription>
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
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={item.id}
                checked={effectiveCheckedItems[item.id] || false}
                onCheckedChange={(checked) =>
                  !autoCheckedItems && setCheckedItems({ ...checkedItems, [item.id]: checked as boolean })
                }
                disabled={!!autoCheckedItems}
                className="mt-0.5"
              />
              <label
                htmlFor={item.id}
                className="flex-1 text-sm leading-relaxed cursor-pointer"
              >
                {item.category && (
                  <span className="text-xs font-medium text-primary mr-2">
                    [{item.category}]
                  </span>
                )}
                {item.text}
              </label>
            </div>
          ))}
        </div>

        {completionRate === 100 && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-sm text-success">
            <strong>✓ Checklist complete!</strong> You're ready to progress to the next stage.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
