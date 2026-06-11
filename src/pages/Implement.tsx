import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlayCircle, Clock, CheckCircle2, MessageSquare, TrendingUp, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImplementationBehaviors } from "@/components/ImplementationBehaviors";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useSearchParams } from "react-router-dom";
import { addDays, format, isBefore, parseISO, startOfDay } from "date-fns";
import { TimelineTracker } from "@/components/TimelineTracker";
import { ObservationModeSelector } from "@/components/ObservationModeSelector";
import { FlexibleObservationDialog } from "@/components/FlexibleObservationDialog";
import { PDSACycleAssistant } from "@/components/PDSACycleAssistant";
import { FidelityTrendsChart } from "@/components/dashboard/FidelityTrendsChart";
import { PDCompletionTracker } from "@/components/PDCompletionTracker";
import { useState } from "react";

export default function Implement() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  const { activeIngredients, isLoading: isLoadingIngredients } = useActiveIngredients(effectiveInitiativeId);
  const { strategies, isLoading: isLoadingStrategies } = useImplementationStrategies(effectiveInitiativeId);
  const { teamMembers } = useTeamMembers(effectiveInitiativeId);
  const { fidelityLogs, createLog, isCreating } = useFidelityLogs(effectiveInitiativeId);
  const { milestones } = useTimelineMilestones(effectiveInitiativeId);
  const { activities: pdActivities } = usePDActivities(effectiveInitiativeId);

  const [observationMode, setObservationMode] = useState<'quick' | 'detailed' | 'team' | null>(null);

  const coreIngredients = activeIngredients.filter((ing: any) => ing.is_core ?? ing.isCore);

  // Derive real nudges: milestones due within 14 days and overdue PD activities
  const today = startOfDay(new Date());
  const nudgeHorizon = addDays(today, 14);
  const nudges = [
    ...milestones
      .filter((m) => {
        if (m.status === "completed" || !m.target_date) return false;
        const target = startOfDay(parseISO(m.target_date));
        return !isBefore(target, today) && !isBefore(nudgeHorizon, target);
      })
      .map((m) => ({
        id: `milestone-${m.id}`,
        text: `Milestone approaching: ${m.milestone}`,
        detail: `Due ${format(parseISO(m.target_date), "MMM d, yyyy")}`,
        label: "Milestone",
      })),
    ...pdActivities
      .filter((a) =>
        a.completion_status === "planned" &&
        a.scheduled_date &&
        isBefore(startOfDay(parseISO(a.scheduled_date)), today)
      )
      .map((a) => ({
        id: `pd-${a.id}`,
        text: `PD activity needs follow-up: ${a.title}`,
        detail: `Scheduled ${format(parseISO(a.scheduled_date!), "MMM d, yyyy")} — mark complete or reschedule`,
        label: "PD",
      })),
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <PlayCircle className="h-4 w-4" />
          <span>Stage 3: Implement</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Implement Stage</h1>
        <p className="text-muted-foreground mt-2">
          Put the plan into action while building supportive structures and cultivating a learning culture
        </p>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              What to do in the Implement Stage
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Grow the implementers:</strong> Provide ongoing training, coaching, and support</li>
              <li>• <strong>Build supportive structures:</strong> Establish systems, policies, and resources needed for success</li>
              <li>• <strong>Use improvement cycles:</strong> Apply PDSA (Plan-Do-Study-Act) to continuously refine implementation</li>
              <li>• <strong>Gather implementation data:</strong> Monitor fidelity, adoption, and early outcomes</li>
              <li>• <strong>Harness data for action:</strong> Make data-informed adjustments to improve effectiveness</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Tracker */}
      <TimelineTracker initiativeId={effectiveInitiativeId} stage="implement" />
      
      {/* Active Ingredients from Plan Stage */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Core Active Ingredients (from Plan Stage)
          </CardTitle>
          <CardDescription>
            These components from your plan should be monitored during implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingIngredients ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : coreIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No core ingredients defined yet. Add them in the Plan stage.</p>
          ) : (
            <div className="space-y-2">
              {coreIngredients.map((ingredient: any) => (
                <div key={ingredient.id} className="flex items-start gap-2 text-sm rounded-lg border p-3 bg-background/50">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{ingredient.name}</p>
                    {ingredient.description && (
                      <p className="text-muted-foreground text-xs mt-1">{ingredient.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fidelity Trends */}
      <FidelityTrendsChart />

      {/* PDSA Cycle Assistant */}
      <PDSACycleAssistant initiativeId={effectiveInitiativeId} />

      {/* PD Completion Tracker */}
      <PDCompletionTracker initiativeId={effectiveInitiativeId} />

      {/* Observation Mode Selector */}
      <ObservationModeSelector onSelectMode={(mode) => setObservationMode(mode)} />

      {/* Implementation Nudges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Implementation Nudges</CardTitle>
          </div>
          <CardDescription>
            Contextual prompts based on your timeline milestones and PD activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {nudges.length > 0 ? (
            nudges.map((nudge) => (
              <div key={nudge.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{nudge.text}</p>
                  <p className="text-xs text-muted-foreground">{nudge.detail}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{nudge.label}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No nudges right now — nudges appear when milestones approach or PD activities need follow-up.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Fidelity Logs</TabsTrigger>
          <TabsTrigger value="new-log">New Quick Log</TabsTrigger>
          <TabsTrigger value="behaviors">Behaviors</TabsTrigger>
        </TabsList>

        {/* Fidelity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Fidelity Logs</CardTitle>
                  <CardDescription>
                    Track implementation quality over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">
                    Avg: {fidelityLogs.length > 0 
                      ? (fidelityLogs.reduce((sum, log) => sum + log.rating, 0) / fidelityLogs.length).toFixed(1)
                      : '0'}/5
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fidelityLogs.length > 0 ? (
                  fidelityLogs.slice(0, 5).map((log) => {
                    const ingredient = activeIngredients.find(ing => ing.id === log.component_id);
                    const logTypeLabels = {
                      quick: '60s Quick',
                      detailed: 'Coach Obs',
                      team: 'Team Check',
                      standard: 'Standard'
                    };
                    
                    return (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{ingredient?.name || 'Unknown Component'}</p>
                            <Badge variant="outline" className="text-xs">
                              {logTypeLabels[log.log_type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.observed_at).toLocaleDateString()} at {new Date(log.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {log.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{log.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.rating >= 4 ? "default" : log.rating >= 3 ? "secondary" : "destructive"}>
                            {log.rating}/5
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No observations recorded yet</p>
                    <p className="text-xs mt-1">Use one of the observation modes above to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Log Tab */}
        <TabsContent value="new-log" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>60-Second Fidelity Check</CardTitle>
              <CardDescription>
                Quick observation of core components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Component Being Observed</Label>
                  <select className="w-full rounded-md border px-3 py-2">
                    {coreIngredients.length > 0 ? (
                      coreIngredients.map((ingredient: any) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No core active ingredients defined yet</option>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {coreIngredients.length > 0 
                      ? "Select from your core active ingredients defined in Plan stage"
                      : "Define active ingredients in Plan stage to track them here"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Fidelity Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-colors font-semibold"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    1 = Not implemented, 5 = Fully implemented as planned
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Quick Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any observations, barriers, or adjustments needed..."
                    rows={3}
                  />
                </div>
              </div>

              <Button className="w-full">Save Fidelity Log</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Behaviors Tab */}
        <TabsContent value="behaviors" className="space-y-6">
          <ImplementationBehaviors />
        </TabsContent>
      </Tabs>

      {/* Flexible Observation Dialog */}
      <FlexibleObservationDialog
        open={!!observationMode}
        onOpenChange={(open) => !open && setObservationMode(null)}
        mode={observationMode || 'quick'}
        activeIngredients={activeIngredients}
        teamMembers={teamMembers}
        onSubmit={createLog}
        isSubmitting={isCreating}
      />
    </div>
  );
}
