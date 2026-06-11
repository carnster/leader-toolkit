import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface EquityChecklistProps {
  checked: { [key: string]: boolean };
  onCheckedChange: (id: string, checked: boolean) => void;
  notes: { [key: string]: string };
  onNotesChange: (id: string, notes: string) => void;
}

const equityItems = [
  {
    id: "disproportionate_impact",
    label: "Identified groups disproportionately affected by the problem",
    prompt: "Which groups (students with IEPs, English learners, economically disadvantaged students, students of color) are most impacted?",
  },
  {
    id: "access_barriers",
    label: "Considered potential access barriers for different groups",
    prompt: "What barriers might prevent equal access (language, disability, time, cost)?",
  },
  {
    id: "culturally_responsive",
    label: "Ensured approach is culturally responsive and inclusive",
    prompt: "How does the initiative respect and include diverse cultures and backgrounds?",
  },
  {
    id: "family_engagement",
    label: "Planned inclusive family engagement strategies",
    prompt: "How will you engage families from diverse backgrounds (translations, timing, formats)?",
  },
  {
    id: "monitoring_equity",
    label: "Plan to monitor outcomes by subgroup",
    prompt: "How will you track if the initiative reduces or widens gaps between groups?",
  },
  {
    id: "resource_allocation",
    label: "Allocated resources to address equity concerns",
    prompt: "What specific resources will support equitable implementation?",
  },
];

export function EquityChecklist({ checked, onCheckedChange, notes, onNotesChange }: EquityChecklistProps) {
  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = equityItems.length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Equity & Inclusion Checklist</CardTitle>
          </div>
          <Badge variant={completedCount === totalCount ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <CardDescription>
          Ensure your initiative actively addresses equity and inclusion
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