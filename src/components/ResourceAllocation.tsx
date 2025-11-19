import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, Plus, Edit, Calculator, Loader2, Sparkles } from "lucide-react";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useTimeCommitments } from "@/hooks/useTimeCommitments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useImplementationRisks } from "@/hooks/useImplementationRisks";
import { usePDActivities } from "@/hooks/usePDActivities";
import { BudgetItemDialog } from "@/components/BudgetItemDialog";
import { TimeCommitmentDialog } from "@/components/TimeCommitmentDialog";
import { BudgetRecommendations } from "@/components/BudgetRecommendations";
import { calculateTimeCommitments } from "@/lib/timeCommitmentCalculator";
import type { BudgetItem } from "@/hooks/useBudgetItems";
import type { TimeCommitment } from "@/hooks/useTimeCommitments";
import { useToast } from "@/hooks/use-toast";

interface ResourceAllocationProps {
  initiativeId: string;
}

export function ResourceAllocation({ initiativeId }: ResourceAllocationProps) {
  const { toast } = useToast();
  const { budgetItems, isLoading: isLoadingBudget } = useBudgetItems(initiativeId);
  const { timeCommitments, autoGenerateTimeCommitments, isAutoGenerating, isLoading: isLoadingTime } = useTimeCommitments(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const { strategies } = useImplementationStrategies(initiativeId);
  const { milestones } = useTimelineMilestones(initiativeId);
  const { risks } = useImplementationRisks(initiativeId);
  const { activities: pdActivities } = usePDActivities(initiativeId);
  
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | undefined>(undefined);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [editingTimeCommitment, setEditingTimeCommitment] = useState<TimeCommitment | undefined>(undefined);
  const [showBudgetRecommendations, setShowBudgetRecommendations] = useState(false);

  const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimated_cost, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  const handleAutoCalculate = async () => {
    if (!teamMembers.length) {
      toast({
        title: "No team members",
        description: "Add team members before auto-calculating time commitments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const calculated = await calculateTimeCommitments(
        initiativeId,
        teamMembers,
        strategies,
        milestones,
        risks,
        pdActivities
      );

      if (calculated.length === 0) {
        toast({
          title: "No assignments found",
          description: "Assign team members to strategies, milestones, risks, PD activities, or communication activities first.",
          variant: "destructive",
        });
        return;
      }

      autoGenerateTimeCommitments(
        calculated.map((c) => ({
          initiative_id: initiativeId,
          role_name: c.role_name,
          hours_per_week: c.hours_per_week,
          hours_per_month: c.hours_per_month,
          description: c.description,
          notes: null,
        }))
      );
    } catch (error) {
      console.error("Error calculating time commitments:", error);
      toast({
        title: "Calculation error",
        description: "Failed to calculate time commitments. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {showBudgetRecommendations ? (
        <BudgetRecommendations 
          initiativeId={initiativeId}
          onClose={() => setShowBudgetRecommendations(false)}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Resource Allocation & Budget</CardTitle>
            </div>
            <CardDescription>
              Track budget, time commitments, and resource requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget Categories */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget Breakdown
                </h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBudgetRecommendations(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Recommendations
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingBudgetItem(undefined);
                      setBudgetDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manual
                  </Button>
                </div>
              </div>
            
            {isLoadingBudget ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading budget items...</p>
            ) : budgetItems.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-2">No budget items yet</p>
                <p className="text-xs text-muted-foreground">
                  Click "AI Recommendations" to generate budget suggestions based on your initiative, or add items manually
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {budgetItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.category}</p>
                        {item.funding_source && (
                          <Badge variant="outline" className="text-xs">{item.funding_source}</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono">
                          ${item.estimated_cost.toFixed(2)}
                        </Badge>
                        {item.actual_cost && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Actual: ${item.actual_cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingBudgetItem(item);
                          setBudgetDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 rounded-lg border bg-primary/5">
                  <p className="font-semibold">Total Estimated Cost</p>
                  <Badge variant="default" className="font-mono">
                    ${totalEstimated.toFixed(2)}
                  </Badge>
                </div>
                {totalActual > 0 && (
                  <div className="flex justify-between items-center p-3 rounded-lg border bg-secondary/5">
                    <p className="font-semibold">Total Actual Cost</p>
                    <Badge variant="secondary" className="font-mono">
                      ${totalActual.toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Commitments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Commitments by Role
              </h4>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleAutoCalculate}
                  disabled={isAutoGenerating}
                >
                  {isAutoGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Auto-Calculate
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setEditingTimeCommitment(undefined);
                    setTimeDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual
                </Button>
              </div>
            </div>
            
            {isLoadingTime ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading time commitments...</p>
            ) : timeCommitments.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-2">No time commitments yet</p>
                <p className="text-xs text-muted-foreground">
                  Click "Auto-Calculate" to generate time commitments based on team assignments, or add manual entries
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeCommitments.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{item.role_name}</span>
                      <div className="flex items-center gap-2">
                        {item.hours_per_week && (
                          <Badge variant="secondary">{item.hours_per_week} hrs/week</Badge>
                        )}
                        {item.hours_per_month && (
                          <Badge variant="secondary">{item.hours_per_month} hrs/month</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingTimeCommitment(item);
                            setTimeDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resource Protection */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">Resource Protection Plan</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Critical:</strong> Identify resources that are essential and cannot be cut, even in budget constraints.
              Establish contingency plans for maintaining core resources if funding is reduced.
            </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Dialogs */}
      <BudgetItemDialog
        item={editingBudgetItem}
        open={budgetDialogOpen}
        onOpenChange={(open) => {
          setBudgetDialogOpen(open);
          if (!open) setEditingBudgetItem(undefined);
        }}
        initiativeId={initiativeId}
      />

      <TimeCommitmentDialog
        item={editingTimeCommitment}
        open={timeDialogOpen}
        onOpenChange={(open) => {
          setTimeDialogOpen(open);
          if (!open) setEditingTimeCommitment(undefined);
        }}
        initiativeId={initiativeId}
      />
    </>
  );
}
