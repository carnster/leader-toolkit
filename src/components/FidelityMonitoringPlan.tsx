import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, Users } from "lucide-react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface FidelityMonitoringPlanProps {
  activeIngredients: ActiveIngredient[];
}

export function FidelityMonitoringPlan({ activeIngredients }: FidelityMonitoringPlanProps) {
  const coreIngredients = activeIngredients.filter(ing => ing.is_core);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <CardTitle>Fidelity Monitoring Plan</CardTitle>
        </div>
        <CardDescription>
          Systematic observation and data collection to ensure quality implementation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Observation Schedule */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Observation Schedule
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-3 rounded-lg border">
              <span className="font-medium">Phase 1: Installation</span>
              <span className="text-muted-foreground">Weekly observations</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg border">
              <span className="font-medium">Phase 2: Initial Implementation</span>
              <span className="text-muted-foreground">Bi-weekly observations</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg border">
              <span className="font-medium">Phase 3: Full Implementation</span>
              <span className="text-muted-foreground">Monthly observations</span>
            </div>
          </div>
        </div>

        {/* What to Monitor */}
        <div>
          <h4 className="font-semibold mb-3">Core Ingredients to Monitor</h4>
          <div className="space-y-3">
            {coreIngredients.length > 0 ? (
              coreIngredients.map((ingredient) => (
                <div key={ingredient.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ingredient.name}</span>
                    <Badge variant="default" className="text-xs">Core</Badge>
                  </div>
                  {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Observable Indicators:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                        {ingredient.look_fors.map((lookFor, idx) => (
                          <li key={idx}>• {lookFor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Add core active ingredients to define monitoring focus</p>
            )}
          </div>
        </div>

        {/* Data Collection Methods */}
        <div>
          <h4 className="font-semibold mb-3">Data Collection Methods</h4>
          <div className="grid gap-2">
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Direct Observation</p>
              <p className="text-xs text-muted-foreground">Structured classroom/session observations using fidelity checklist</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Self-Report Surveys</p>
              <p className="text-xs text-muted-foreground">Implementer logs and reflection forms</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Artifact Review</p>
              <p className="text-xs text-muted-foreground">Review of lesson plans, materials, student work</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Coaching Notes</p>
              <p className="text-xs text-muted-foreground">Documentation from coaching sessions and feedback cycles</p>
            </div>
          </div>
        </div>

        {/* Roles & Responsibilities */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Monitoring Roles
          </h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Implementation Coach: </span>
              <span className="text-muted-foreground">Conducts observations, provides feedback</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Team Lead: </span>
              <span className="text-muted-foreground">Reviews fidelity data, coordinates support</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Implementers: </span>
              <span className="text-muted-foreground">Complete self-assessments, participate in feedback</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
