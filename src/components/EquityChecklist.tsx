import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

// The equity reflection is meant to sharpen as the work moves through the
// stages, so the prompts are stage-specific rather than one static list.
// Source: stage-specific equity reflection, Alberta Implementation Guidebook.
export type EquityStage = "decide" | "plan" | "implement" | "sustain";

interface EquityChecklistProps {
  /** Which stage's question set to render. Answers for every stage share one
   *  jsonb store, keyed by question id, so nothing is lost when the stage changes. */
  stage: EquityStage;
  checked: { [key: string]: boolean };
  onCheckedChange: (id: string, checked: boolean) => void;
  notes: { [key: string]: string };
  onNotesChange: (id: string, notes: string) => void;
}

interface EquityItem {
  id: string;
  label: string;
  prompt: string;
}

// Questions are written to be falsifiable (you can answer yes or no with
// evidence) and asset-framed (they build on the strengths of the students
// furthest from opportunity rather than naming a deficit). Ids are unique
// across stages so the shared jsonb store never collides.
const STAGE_LABELS: Record<EquityStage, string> = {
  decide: "Decide",
  plan: "Plan & Prepare",
  implement: "Implement",
  sustain: "Spread & Sustain",
};

const EQUITY_QUESTIONS_BY_STAGE: Record<EquityStage, EquityItem[]> = {
  decide: [
    {
      id: "decide_problem_knowledge",
      label: "Whose knowledge shaped how we defined this problem?",
      prompt: "Name the students, families, and staff closest to the problem who informed the definition, not only the data.",
    },
    {
      id: "decide_named_strengths",
      label: "Have we named the strengths of the students most affected, not only the gap?",
      prompt: "What assets, relationships, and existing supports are we building on?",
    },
    {
      id: "decide_least_voice",
      label: "Which affected group had the least say so far, and how will we bring them in?",
      prompt: "Name the group and the specific next step that includes them.",
    },
    {
      id: "decide_disaggregated_baseline",
      label: "Does our baseline show the problem broken out by student group?",
      prompt: "Which subgroups are we comparing, and what does the split actually show?",
    },
  ],
  plan: [
    {
      id: "plan_equal_access_by_design",
      label: "Will the students furthest from opportunity get equal access to this, by design not by chance?",
      prompt: "What in the plan guarantees their access rather than leaving it to luck?",
    },
    {
      id: "plan_barriers_designed_out",
      label: "Which access barriers (language, disability, time, cost, transport) have we designed out?",
      prompt: "List each barrier and the design choice that removes it.",
    },
    {
      id: "plan_who_delivers",
      label: "Do the adults delivering this understand the students it serves?",
      prompt: "Who delivers it, and what specifically prepares them for these students?",
    },
    {
      id: "plan_resources_weighted",
      label: "Are resources weighted toward the students who need the most, not split evenly?",
      prompt: "Where do the extra time, staffing, or dollars actually go?",
    },
  ],
  implement: [
    {
      id: "implement_disaggregate_early",
      label: "Are we disaggregating early results by student group?",
      prompt: "Which groups are we watching, and how often are we looking?",
    },
    {
      id: "implement_participation_not_enrollment",
      label: "Are the students furthest from opportunity actually participating, not just enrolled?",
      prompt: "What do attendance and participation look like broken out by group?",
    },
    {
      id: "implement_feedback_channel",
      label: "Do the students and families most affected have a way to tell us what is working?",
      prompt: "What channel exists, and who is actually using it?",
    },
    {
      id: "implement_group_specific_adjustment",
      label: "When something is not landing for a group, are we adjusting for them specifically?",
      prompt: "Name one adjustment made for a specific group this cycle.",
    },
  ],
  sustain: [
    {
      id: "sustain_who_loses_first",
      label: "If funding shrinks, which students lose access first, and how do we protect them?",
      prompt: "Name the group and the protection you would hold onto no matter what.",
    },
    {
      id: "sustain_embedded_for_them",
      label: "Is this embedded in a way that keeps serving the students who benefited most?",
      prompt: "What routine or policy locks in their access for the long term?",
    },
    {
      id: "sustain_outcomes_narrowed",
      label: "Did outcomes improve for the students furthest from opportunity, not just on average?",
      prompt: "What does the disaggregated result show over time?",
    },
    {
      id: "sustain_local_ownership",
      label: "Do the people closest to the students have real ownership of continuing this?",
      prompt: "Who owns it now, and what authority over time and resources do they hold?",
    },
  ],
};

export function EquityChecklist({ stage, checked, onCheckedChange, notes, onNotesChange }: EquityChecklistProps) {
  const equityItems = EQUITY_QUESTIONS_BY_STAGE[stage];
  const totalCount = equityItems.length;
  // Count only this stage's items so the badge reflects the questions on screen,
  // even though answers for other stages live in the same store.
  const completedCount = equityItems.filter((item) => checked[item.id]).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Equity &amp; Inclusion Reflection</CardTitle>
          </div>
          <Badge variant={completedCount === totalCount ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <CardDescription>
          Equity questions for the {STAGE_LABELS[stage]} stage. Answer honestly. An unchecked question is
          where to look next, not a grade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {equityItems.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id={item.id}
                checked={checked[item.id] || false}
                onCheckedChange={(c) => onCheckedChange(item.id, c as boolean)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground italic">{item.prompt}</p>
                {checked[item.id] && (
                  <Textarea
                    placeholder="Add your notes here..."
                    value={notes[item.id] || ""}
                    onChange={(e) => onNotesChange(item.id, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
