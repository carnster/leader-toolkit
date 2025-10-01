import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, Brain } from "lucide-react";

export function ImplementationBehaviors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engage → Unite → Reflect</CardTitle>
        <CardDescription>
          Cross-cutting behaviors that drive effective implementation (EEF Framework)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border-l-4 border-primary p-4 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-primary">Engage</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Engage people so they can shape what happens while also providing overall direction
          </p>
          <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
            <li>• Create opportunities for staff input and feedback</li>
            <li>• Surface concerns and ideas in regular check-ins</li>
            <li>• Build ownership through collaborative decision-making</li>
          </ul>
        </div>

        <div className="rounded-lg border-l-4 border-secondary p-4 bg-secondary/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-secondary" />
            <h4 className="font-semibold text-secondary">Unite</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Unite people around what is being implemented, how it will be implemented, and why it matters
          </p>
          <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
            <li>• Establish shared understanding of the change</li>
            <li>• Align on focus practices and priorities</li>
            <li>• Build collective commitment to implementation</li>
          </ul>
        </div>

        <div className="rounded-lg border-l-4 border-accent p-4 bg-accent/5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-accent" />
            <h4 className="font-semibold text-accent">Reflect</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Reflect, monitor, and adapt to improve implementation quality and outcomes
          </p>
          <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
            <li>• Use data to understand what's working</li>
            <li>• Run rapid improvement cycles (PDSA)</li>
            <li>• Make evidence-informed adjustments</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
