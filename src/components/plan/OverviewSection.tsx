import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";
import { useNavigate } from "react-router-dom";
import { ImplementationPlanExport } from "@/components/ImplementationPlanExport";

interface OverviewSectionProps {
  activeIngredientsCount: number;
  strategiesCount: number;
  teamMembersCount: number;
  milestonesCount: number;
  risksCount: number;
  pdActivitiesCount: number;
  onGenerateFullPlan: () => void;
  isGenerating: boolean;
  nextStep: string;
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
  nextStep,
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
  const navigate = useNavigate();
  const totalRequired = 6;
  const completed = [
    activeIngredientsCount,
    strategiesCount,
    teamMembersCount,
    milestonesCount,
    risksCount,
    pdActivitiesCount,
  ].filter((count) => count > 0).length;

  const completionPercentage = Math.round((completed / totalRequired) * 100);
  const isReady = completionPercentage === 100;

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
              <span className="text-muted-foreground">Overall Progress</span>
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
          {!isReady && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Next Step</p>
                  <p className="text-sm text-muted-foreground">{nextStep}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">{activeIngredientsCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Ingredients</div>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-primary">{strategiesCount}</div>
              <div className="text-xs text-muted-foreground mt-1">ERIC Strategies</div>
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
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Planning Button */}
      {isReady && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to Move to Implementation</h3>
                <p className="text-sm text-muted-foreground">
                  Your comprehensive implementation plan is complete. You can now begin the Implement stage.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate(`/implement?initiative=${initiativeId}`)}
                className="gap-2"
              >
                Move to Implement Stage
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
