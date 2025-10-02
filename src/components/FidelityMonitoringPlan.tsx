import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Calendar, BarChart3, ClipboardCheck } from "lucide-react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import { FidelityDashboard } from "@/components/FidelityDashboard";
import { ObservationCalendar } from "@/components/ObservationCalendar";
import { ConductObservationDialog } from "@/components/ConductObservationDialog";
import { Button } from "@/components/ui/button";

interface FidelityMonitoringPlanProps {
  activeIngredients: ActiveIngredient[];
  initiativeId: string;
}

export function FidelityMonitoringPlan({ activeIngredients, initiativeId }: FidelityMonitoringPlanProps) {
  const [conductDialogOpen, setConductDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setConductDialogOpen(true)} size="lg">
          <ClipboardCheck className="mr-2 h-5 w-5" />
          Conduct Observation
        </Button>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Monitoring Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <FidelityDashboard initiativeId={initiativeId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <ObservationCalendar initiativeId={initiativeId} />
        </TabsContent>

        <TabsContent value="plan" className="space-y-6 mt-6">
          {/* Static monitoring plan content for reference */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Observation Schedule Framework */}
            <div className="p-6 rounded-lg border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recommended Observation Frequency
              </h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Installation (0-25%)</p>
                  <p className="text-muted-foreground">Weekly observations</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Initial Implementation (26-75%)</p>
                  <p className="text-muted-foreground">Bi-weekly observations</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Full Implementation (76-100%)</p>
                  <p className="text-muted-foreground">Monthly observations</p>
                </div>
              </div>
            </div>

            {/* Data Collection Methods */}
            <div className="p-6 rounded-lg border bg-card">
              <h4 className="font-semibold mb-4">Data Collection Methods</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Direct Observation</p>
                  <p className="text-xs text-muted-foreground">Structured classroom/session observations</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Self-Report</p>
                  <p className="text-xs text-muted-foreground">Implementer logs and reflection forms</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Artifact Review</p>
                  <p className="text-xs text-muted-foreground">Lesson plans, materials, student work</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Coaching Notes</p>
                  <p className="text-xs text-muted-foreground">Documentation from coaching sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Ingredients Reference */}
          <div className="p-6 rounded-lg border bg-card">
            <h4 className="font-semibold mb-4">Core Ingredients to Monitor</h4>
            {activeIngredients.filter(ing => ing.is_core).length > 0 ? (
              <div className="space-y-4">
                {activeIngredients.filter(ing => ing.is_core).map((ingredient) => (
                  <div key={ingredient.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h5 className="font-medium">{ingredient.name}</h5>
                    {ingredient.description && (
                      <p className="text-sm text-muted-foreground">{ingredient.description}</p>
                    )}
                    {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Observable Indicators:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          {ingredient.look_fors.map((lookFor, idx) => (
                            <li key={idx}>• {lookFor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add core active ingredients in the Strategic Foundation section to define monitoring focus
              </p>
            )}
          </div>

          {/* Best Practices */}
          <div className="p-6 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold mb-3 text-amber-900 dark:text-amber-100">
              Fidelity Monitoring Best Practices
            </h4>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
              <li>• Schedule observations in advance and ensure implementers are aware</li>
              <li>• Use observation checklists based on core ingredients and look-fors</li>
              <li>• Provide immediate, constructive feedback after observations</li>
              <li>• Track fidelity over time to identify trends and areas for support</li>
              <li>• Link low fidelity scores to coaching and professional development</li>
              <li>• Celebrate improvements and high fidelity implementation</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Conduct Observation Dialog */}
      <ConductObservationDialog
        open={conductDialogOpen}
        onOpenChange={setConductDialogOpen}
        initiativeId={initiativeId}
      />
    </div>
  );
}
