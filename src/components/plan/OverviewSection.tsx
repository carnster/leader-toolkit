import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";
import { ImplementationPlanExport } from "@/components/ImplementationPlanExport";
import { CalendarTaskExport } from "@/components/CalendarTaskExport";
import { PlanReadinessGate } from "@/components/plan/PlanReadinessGate";
import { getPlanProgress, type PlanCounts, type PlanStepId } from "@/lib/planSteps";

interface OverviewSectionProps {
  activeIngredientsCount: number;
  strategiesCount: number;
  teamMembersCount: number;
  milestonesCount: number;
  risksCount: number;
  pdActivitiesCount: number;
  onGenerateFullPlan: () => void;
  isGenerating: boolean;
  counts: PlanCounts;
  onGoToStep: (id: PlanStepId) => void;
  initiativeId: string;
  initiativeTitle: string;
  activeIngredients: any[];
  strategies: any[];
  teamMembers: any[];
  timeCommitments: any[];
  communicationActivities: any[];
  milestones: any[];
  risks: any[];
  pdActivities: any[];
  budgetItems?: any[];
  fidelityChecklists?: any[];
  observationSchedules?: any[];
  decisionBrief?: any;
}

export function OverviewSection({
  activeIngredientsCount,
  strategiesCount,
  teamMembersCount,
  milestonesCount,
  risksCount,
  pdActivitiesCount,
  onGenerateFullPlan,
  isGenerating,
  counts,
  onGoToStep,
  initiativeId,
  initiativeTitle,
  activeIngredients,
  strategies,
  teamMembers,
  timeCommitments,
  communicationActivities,
  milestones,
  risks,
  pdActivities,
  budgetItems = [],
  fidelityChecklists = [],
  observationSchedules = [],
  decisionBrief = null,
}: OverviewSectionProps) {
  const progress = getPlanProgress(counts);
  const completionPercentage = progress.percent;
  const isReady = progress.isReady;

  return (
    <div className="space-y-6">
      {/* Header with Generate Full Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Planning Overview
              </CardTitle>
              <CardDescription className="mt-2">
                Track your planning progress and get AI-powered recommendations
              </CardDescription>
            </div>
            {completionPercentage < 50 && (
              <Button
                onClick={onGenerateFullPlan}
                disabled={isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Full Plan with AI
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {progress.completedSteps} of {progress.totalSteps} steps · {progress.requiredDone} of {progress.requiredTotal} required
              </span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isReady ? "bg-green-600" : "bg-primary"
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Next Step Guidance */}
          {!isReady && progress.nextStep && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">
                      Next step: {progress.nextStep.number}. {progress.nextStep.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{progress.nextStep.why}</p>
                  </div>
                </div>
                <Button onClick={() => onGoToStep(progress.nextStep!.id)} className="gap-2">
                  Go to step {progress.nextStep.number}
                </Button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg border text-center" title="The specific practices that make this initiative work, each defined with look-fors you can verify in a visit.">
              <div className="text-2xl font-bold text-primary">{activeIngredientsCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Ingredients</div>
            </div>
            <div className="p-4 rounded-lg border text-center" title="Implementation strategies: how you get people actually doing the practices, drawn from the ERIC research framework.">
              <div className="text-2xl font-bold text-primary">{strategiesCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Strategies</div>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">{teamMembersCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Team Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Checklist */}
      <ReadinessChecklist
        activeIngredientsCount={activeIngredientsCount}
        strategiesCount={strategiesCount}
        teamMembersCount={teamMembersCount}
        milestonesCount={milestonesCount}
        risksCount={risksCount}
        pdActivitiesCount={pdActivitiesCount}
        communicationActivitiesCount={communicationActivities.length}
        budgetItemsCount={budgetItems.length}
        fidelityChecklistsCount={fidelityChecklists.length}
        observationSchedulesCount={observationSchedules.length}
        activeIngredients={activeIngredients}
        decisionBrief={decisionBrief}
      />

      {/* Export Implementation Plan */}
      {completionPercentage >= 50 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Export Implementation Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Download a comprehensive PDF document of your implementation plan
                </p>
              </div>
              <ImplementationPlanExport
                initiativeTitle={initiativeTitle}
                activeIngredients={activeIngredients}
                strategies={strategies}
                teamMembers={teamMembers}
                timeCommitments={timeCommitments}
                communicationActivities={communicationActivities}
                milestones={milestones}
                risks={risks}
                pdActivities={pdActivities}
                fidelityChecklists={fidelityChecklists}
                observationSchedules={observationSchedules}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar & Task Export */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-lg mb-1">Send Dates to Your Calendar & Task List</h3>
              <p className="text-sm text-muted-foreground">
                Milestones, PD sessions, and communication activities as a calendar file (works with Google,
                Outlook, and Apple Calendar) or a task list CSV
              </p>
            </div>
            <CalendarTaskExport initiativeId={initiativeId} initiativeTitle={initiativeTitle} />
          </div>
        </CardContent>
      </Card>

      <PlanReadinessGate initiativeId={initiativeId} counts={counts} onGoToStep={onGoToStep} />
    </div>
  );
}
