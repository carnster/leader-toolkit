import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlayCircle, Clock, CheckCircle2, Circle, MessageSquare, TrendingUp, Lightbulb, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImplementationBehaviors } from "@/components/ImplementationBehaviors";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { NoIngredientsNotice } from "@/components/NoIngredientsNotice";
import { CommitmentsPanel } from "@/components/CommitmentsPanel";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { usePDActivities } from "@/hooks/usePDActivities";
import { usePDSACycles } from "@/hooks/usePDSACycles";
import { usePulseCheckins } from "@/hooks/usePulseCheckins";
import { useCommitments } from "@/hooks/useCommitments";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IMPLEMENT_STEPS, stageProgress, stepById } from "@/lib/stageSteps";
import { StageProgressHeader } from "@/components/StageProgressHeader";
import { StageStepFrame } from "@/components/StageStepFrame";
import { addDays, format, isBefore, parseISO, startOfDay } from "date-fns";
import { ObservationModeSelector } from "@/components/ObservationModeSelector";
import { AdaptationLog } from "@/components/AdaptationLog";
import { StageEquityCard } from "@/components/StageEquityCard";
import { FlexibleObservationDialog } from "@/components/FlexibleObservationDialog";
import { PDSACycleAssistant } from "@/components/PDSACycleAssistant";
import { PDCompletionTracker } from "@/components/PDCompletionTracker";
import { useState } from "react";
import { NoInitiativeGate } from "@/components/NoInitiativeGate";
import { WeeklyPulseForm } from "@/components/pulse/WeeklyPulseForm";
import { PulseDashboard } from "@/components/pulse/PulseDashboard";
import { PulseSharePanel } from "@/components/pulse/PulseSharePanel";
import { QueryErrorState } from "@/components/QueryErrorState";
import { MasterChecklist } from "@/components/MasterChecklist";

const STEP_NUDGE: Record<string, string> = {
  training: "Before day one, every implementer should be able to say the core ingredients out loud. If they can't, that's the first training.",
  observe: "Aim for one visit per core ingredient per month. Short and regular beats long and rare.",
  pulse: "Two minutes a week from each implementer tells you more than a survey in June. Share the link and keep it light.",
  improve: "Pick the smallest change that could matter, try it for two weeks, and decide. Adopt, adapt, or abandon are all wins.",
  review: "Sustain is not a finish line. It's the point where the practice would keep going if you left.",
};

const FIRST_MISSING_LABEL: Record<"training" | "observe" | "improve", string> = {
  training: "Plan and log training in step 1",
  observe: "Log your first visit in step 2",
  improve: "Run one small test in step 4",
};

export default function Implement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";

  const { activeIngredients, isLoading: isLoadingIngredients, error: ingredientsError } = useActiveIngredients(effectiveInitiativeId);
  const { strategies, isLoading: isLoadingStrategies, error: strategiesError } = useImplementationStrategies(effectiveInitiativeId);
  const { teamMembers } = useTeamMembers(effectiveInitiativeId);
  const { fidelityLogs, createLog, isCreating } = useFidelityLogs(effectiveInitiativeId);
  // Two-dimension checklist logs write rating = null; legacy 1-5 averages
  // below are computed only over logs that carry a rating.
  const ratedFidelityLogs = fidelityLogs.filter((log): log is typeof log & { rating: number } => typeof log.rating === "number");
  const { milestones } = useTimelineMilestones(effectiveInitiativeId);
  const { activities: pdActivities } = usePDActivities(effectiveInitiativeId);
  const { pdsaCycles } = usePDSACycles(effectiveInitiativeId);
  const { checkins } = usePulseCheckins(effectiveInitiativeId);
  const { commitments } = useCommitments(effectiveInitiativeId);

  const [observationMode, setObservationMode] = useState<'quick' | 'detailed' | 'team' | null>(null);
  const [moving, setMoving] = useState(false);

  const coreIngredients = activeIngredients.filter((ing: any) => ing.is_core ?? ing.isCore);

  const done: Record<string, boolean> = {
    training: pdActivities.length > 0,
    observe: fidelityLogs.length > 0,
    pulse: checkins.length > 0 || commitments.length > 0,
    improve: (pdsaCycles?.length ?? 0) > 0,
  };
  done.review = done.training && done.observe && done.improve;
  const progress = stageProgress(IMPLEMENT_STEPS, done);
  const currentStep = stepById(IMPLEMENT_STEPS, searchParams.get("section")) ?? IMPLEMENT_STEPS[0];

  const goToStep = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", id);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveToSustain = async () => {
    if (!effectiveInitiativeId || !progress.isReady) return;
    setMoving(true);
    // RLS refuses a write it does not allow by matching zero rows, not by
    // erroring, so read the row back: an empty result means nothing moved.
    const { data: moved, error } = await supabase.from("initiatives").update({ stage: "sustain" }).eq("id", effectiveInitiativeId).select("id");
    setMoving(false);
    if (error || !moved?.length) {
      toast({ title: "Couldn't update the stage", description: error?.message || "Only the initiative owner or a school admin can move it to the next stage. Ask them to make the move.", variant: "destructive" });
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["initiatives"] }),
      queryClient.invalidateQueries({ queryKey: ["stage-completion", effectiveInitiativeId] }),
    ]);
    toast({ title: "You're in Spread & Sustain", description: "The practice is running. Now make it routine and protect it." });
    navigate(`/sustain?initiative=${effectiveInitiativeId}`);
  };

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
        detail: `Scheduled ${format(parseISO(a.scheduled_date!), "MMM d, yyyy")}. Mark complete or reschedule.`,
        label: "PD",
      })),
  ];

  // Evidence for the review step: what the data actually shows, not just yes/no.
  const DAY = 86400000;
  const rated30 = fidelityLogs.filter(l => typeof l.rating === "number" && Date.now() - new Date(l.observed_at).getTime() <= 30 * DAY);
  const avg30 = rated30.length ? (rated30.reduce((s, l) => s + (l.rating ?? 0), 0) / rated30.length) : null;
  const lastObs = fidelityLogs.length ? Math.max(...fidelityLogs.map(l => new Date(l.observed_at).getTime())) : null;
  const daysSinceObs = lastObs ? Math.floor((Date.now() - lastObs) / DAY) : null;
  const decided = (pdsaCycles ?? []).filter(c => c.decision && c.decision.trim()).length;
  const firstMissing = (["training", "observe", "improve"] as const).find((k) => !done[k]);

  if (!effectiveInitiativeId) {
    return <NoInitiativeGate title="Implement" sub="No initiative is selected yet." />;
  }

  // A failed fetch on a populated initiative must not render as an empty
  // Implement stage: that invites re-entering ingredients and strategies.
  if (ingredientsError || strategiesError) {
    return (
      <div className="space-y-8 max-w-7xl">
        <QueryErrorState title="We could not load this initiative" />
      </div>
    );
  }

  return (
    <div className="flex max-w-7xl flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <PlayCircle className="h-4 w-4" />
          <span>Stage 3 of 4: Implement</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Implement</h1>
        <p className="text-muted-foreground mt-2">
          Put the plan into action while building the structures and habits that support it. Monitoring runs continuously during this stage: track progress in the{" "}
          <Link to="/monitor" className="font-medium text-primary underline underline-offset-4">
            Monitoring Hub
          </Link>
          .
        </p>
        <Collapsible className="mt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                <h3 className="font-semibold flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  How this stage works
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-2 text-sm text-muted-foreground mt-3">
                  <li>• <strong>Grow the implementers:</strong> Provide ongoing training, coaching, and support</li>
                  <li>• <strong>Build supportive structures:</strong> Establish systems, policies, and resources needed for success</li>
                  <li>• <strong>Use improvement cycles:</strong> Apply PDSA (Plan-Do-Study-Act) to continuously refine implementation</li>
                  <li>• <strong>Gather implementation data:</strong> Monitor fidelity (how closely practice matches the plan), adoption, and early outcomes</li>
                  <li>• <strong>Act on the data:</strong> make adjustments based on what you are seeing</li>
                </ul>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      </div>

      <StageProgressHeader
        stageName="Implement"
        steps={IMPLEMENT_STEPS}
        done={done}
        onGoToStep={goToStep}
        finalLabel="Ready. Move to Spread & Sustain"
        onFinal={() => goToStep("review")}
      />

      <StageStepFrame
        stage="implement"
        stageName="Implement"
        steps={IMPLEMENT_STEPS}
        step={currentStep}
        done={done}
        onGoToStep={goToStep}
        nudge={STEP_NUDGE[currentStep.id]}
        footerFinal={
          <Button size="lg" onClick={moveToSustain} disabled={!progress.isReady || moving} className="gap-2">
            {moving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Move to Spread & Sustain
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      >
        {currentStep.id === "training" && (
          <>
            {/* An initiative can reach Implement with no core ingredients if Plan was skipped.
                Say so rather than letting the stage render as a set of empty features. */}
            {!isLoadingIngredients && !ingredientsError && coreIngredients.length === 0 && (
              <NoIngredientsNotice stage="the Implement stage" />
            )}

            {/* Active Ingredients from Plan Stage */}
            <Card className="border-primary/30 bg-secondary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Core Active Ingredients (from Plan & Prepare)
                </CardTitle>
                <CardDescription>
                  These components from your plan should be monitored during implementation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingIngredients ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                ) : coreIngredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No core ingredients defined yet. Add them in <Link to={`/plan?initiative=${effectiveInitiativeId}&section=ingredients`} className="text-accent underline underline-offset-2">Plan &amp; Prepare</Link>.</p>
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

            {/* PD Completion Tracker */}
            <PDCompletionTracker initiativeId={effectiveInitiativeId} />
          </>
        )}

        {currentStep.id === "observe" && (
          <>
            {/* Observation Mode Selector */}
            <ObservationModeSelector onSelectMode={(mode) => setObservationMode(mode)} />

            {/* Tabs */}
            <Tabs defaultValue={fidelityLogs.length === 0 ? "new-log" : "logs"} className="space-y-6">
              <TabsList>
                <TabsTrigger value="new-log">Log a visit</TabsTrigger>
                <TabsTrigger value="logs">What we've seen</TabsTrigger>
                <TabsTrigger value="behaviors">Adult practices we're watching</TabsTrigger>
              </TabsList>

              {/* New Log Tab */}
              <TabsContent value="new-log" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>60-Second Fidelity Check</CardTitle>
                    <CardDescription>
                      Quick observation of core components
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* This used to be a form with no state and no save handler: a
                        leader could rate a visit, type notes, click Save, and nothing
                        was stored. The working quick-observation dialog lives on
                        this page already, so open that instead. */}
                    {coreIngredients.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Pick one core ingredient, rate what you saw, add a note. It takes about a minute
                        and goes straight into the fidelity record.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Define your core active ingredients in Plan &amp; Prepare first, then log visits against them here.
                      </p>
                    )}
                    <Button className="w-full" disabled={coreIngredients.length === 0} onClick={() => setObservationMode("quick")}>
                      Log a 60-second check
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

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
                          {/* Two-dimension checklist logs write rating = null (Delivery and
                              Enactment are never averaged into one number), so this legacy
                              average only counts logs that carry a 1-5 rating. */}
                          Avg: {ratedFidelityLogs.length > 0
                            ? (ratedFidelityLogs.reduce((sum, log) => sum + log.rating, 0) / ratedFidelityLogs.length).toFixed(1)
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
                            detailed: 'Coach Observation',
                            team: 'Team Check',
                            standard: 'Standard'
                          };

                          return (
                            <div key={log.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{ingredient?.name || 'Unknown ingredient'}</p>
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
                                {typeof log.rating === "number" ? (
                                  <Badge variant={log.rating >= 4 ? "default" : log.rating >= 3 ? "secondary" : "outline"}>
                                    {log.rating}/5
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Delivery / Enactment</Badge>
                                )}
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

              {/* Implementation Behaviors Tab */}
              <TabsContent value="behaviors" className="space-y-6">
                <ImplementationBehaviors />
              </TabsContent>
            </Tabs>
          </>
        )}

        {currentStep.id === "pulse" && (
          <Tabs defaultValue="pulse" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pulse">
                This week's pulse
                <Badge variant="secondary" className="ml-1.5">{checkins.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="commitments">
                Commitments
                <Badge variant="secondary" className="ml-1.5">{commitments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="reminders">
                Reminders
                <Badge variant="secondary" className="ml-1.5">{nudges.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* This week's pulse: implementer check-in + leader view */}
            <TabsContent value="pulse" className="space-y-6">
              <WeeklyPulseForm initiativeId={effectiveInitiativeId} />
              <PulseSharePanel initiativeId={effectiveInitiativeId} />
              <PulseDashboard initiativeId={effectiveInitiativeId} />
            </TabsContent>

            {/* The loop-closer: support flags, observation follow-ups, and coaching
                next steps all land here until someone closes them. */}
            <TabsContent value="commitments" className="space-y-6">
              <CommitmentsPanel initiativeId={effectiveInitiativeId} />
            </TabsContent>

            {/* Implementation Nudges */}
            <TabsContent value="reminders" className="space-y-6">
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
                    nudges.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{item.label}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No nudges right now. Nudges appear when milestones approach or PD activities need follow-up.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {currentStep.id === "improve" && (
          <>
            {/* PDSA Cycle Assistant */}
            <PDSACycleAssistant initiativeId={effectiveInitiativeId} />

            {/* Living Adaptation Protocol: propose, boundary-check, decide, log */}
            {effectiveInitiativeId && (
              <>
                <p className="text-sm text-muted-foreground">The adaptation log is where you write down what you changed on purpose and why, so a change stays a decision and does not become drift.</p>
                <AdaptationLog initiativeId={effectiveInitiativeId} activeIngredients={activeIngredients} />
              </>
            )}
          </>
        )}

        {currentStep.id === "review" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>What the evidence says</CardTitle>
                <CardDescription>These three have to be true before Spread & Sustain makes sense.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  {pdActivities.length > 0 ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <Circle className="inline h-4 w-4 text-muted-foreground" />}
                  {pdActivities.length} learning activities planned
                </p>
                <p className="flex items-center gap-2">
                  {fidelityLogs.length > 0 ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <Circle className="inline h-4 w-4 text-muted-foreground" />}
                  {avg30 === null
                    ? "No rated observations in the last 30 days"
                    : `Averaging ${avg30.toFixed(1)} of 5 over the last 30 days`}
                  {daysSinceObs !== null && ` · last visit ${daysSinceObs} days ago`}
                </p>
                <p className="flex items-center gap-2">
                  {(pdsaCycles?.length ?? 0) > 0 ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <Circle className="inline h-4 w-4 text-muted-foreground" />}
                  {decided} of {pdsaCycles?.length ?? 0} cycles have a recorded decision
                </p>
                {!progress.isReady && firstMissing && (
                  <div className="pt-2">
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => goToStep(firstMissing)}>
                      {FIRST_MISSING_LABEL[firstMissing]}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {effectiveInitiativeId && (
              <div className="mt-6">
                <StageEquityCard stage="implement" initiativeId={effectiveInitiativeId} />
              </div>
            )}
          </>
        )}
      </StageStepFrame>

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
      <aside className="w-full lg:w-80 lg:shrink-0">
        <div className="lg:sticky lg:top-6">
          <MasterChecklist
            stage="deliver"
            initiativeId={effectiveInitiativeId}
            compact
            autoCheckedItems={{
              "monitoring-systems": fidelityLogs.length > 0,
              "reinforced-pd": pdActivities.length > 1,
            }}
          />
        </div>
      </aside>
    </div>
  );
}
