import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Plus, Edit, Lightbulb, Loader2 } from "lucide-react";
import { ResourceAllocation } from "@/components/ResourceAllocation";
import type { TimelineMilestone } from "@/hooks/useTimelineMilestones";
import type { ImplementationRisk } from "@/hooks/useImplementationRisks";
import { format } from "date-fns";

interface ExecutionPlanningSectionProps {
  milestones: TimelineMilestone[];
  risks: ImplementationRisk[];
  isLoadingMilestones: boolean;
  isLoadingRisks: boolean;
  isGeneratingTimeline: boolean;
  isGeneratingRisks: boolean;
  onAddMilestone: () => void;
  onEditMilestone: (milestone: TimelineMilestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddRisk: () => void;
  onEditRisk: (risk: ImplementationRisk) => void;
  onGenerateTimeline: () => void;
  onGenerateRisks: () => void;
}

export function ExecutionPlanningSection({
  milestones,
  risks,
  isLoadingMilestones,
  isLoadingRisks,
  isGeneratingTimeline,
  isGeneratingRisks,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onAddRisk,
  onEditRisk,
  onGenerateTimeline,
  onGenerateRisks,
}: ExecutionPlanningSectionProps) {
  return (
    <div className="space-y-6">
      {/* Timeline & Milestones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Implementation Timeline</CardTitle>
            </div>
            <div className="flex gap-2">
              {milestones.length === 0 && (
                <Button
                  onClick={onGenerateTimeline}
                  disabled={isGeneratingTimeline}
                  variant="outline"
                >
                  {isGeneratingTimeline ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate Timeline
                    </>
                  )}
                </Button>
              )}
              <Button onClick={onAddMilestone}>
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </div>
          </div>
          <CardDescription>
            Track implementation phases with clear milestones and completion dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMilestones ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading milestones...</p>
          ) : milestones.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
              <p className="text-xs text-muted-foreground">
                Generate AI recommendations or add milestones manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      milestone.status === "completed" ? "border-success bg-success text-success-foreground" :
                      milestone.status === "in_progress" ? "border-primary bg-primary text-primary-foreground" :
                      milestone.status === "at_risk" ? "border-destructive bg-destructive text-destructive-foreground" :
                      "border-muted-foreground/25 bg-background text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="h-full w-[2px] bg-border my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{milestone.phase}</h4>
                        <p className="text-sm text-muted-foreground">{milestone.milestone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          milestone.status === "completed" ? "default" :
                          milestone.status === "in_progress" ? "secondary" :
                          milestone.status === "at_risk" ? "destructive" :
                          "outline"
                        }>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditMilestone(milestone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target: {format(new Date(milestone.target_date), "MMM dd, yyyy")}
                    </p>
                    {milestone.completion_date && (
                      <p className="text-sm text-success">
                        Completed: {format(new Date(milestone.completion_date), "MMM dd, yyyy")}
                      </p>
                    )}
                    {milestone.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{milestone.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Risk Management</CardTitle>
            </div>
            <div className="flex gap-2">
              {risks.length === 0 && (
                <Button
                  onClick={onGenerateRisks}
                  disabled={isGeneratingRisks}
                  variant="outline"
                >
                  {isGeneratingRisks ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate from Feasibility Data
                    </>
                  )}
                </Button>
              )}
              <Button onClick={onAddRisk}>
                <Plus className="mr-2 h-4 w-4" />
                Add Risk
              </Button>
            </div>
          </div>
          <CardDescription>
            Identify potential barriers and develop mitigation strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRisks ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading risks...</p>
          ) : risks.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No risks identified yet.</p>
              <p className="text-xs text-muted-foreground">
                Generate AI recommendations based on feasibility scores or add manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((risk) => {
                const getRiskScore = () => {
                  const scores = { low: 1, medium: 2, high: 3 };
                  return scores[risk.likelihood] * scores[risk.impact];
                };
                return (
                  <div key={risk.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{risk.risk_description}</h4>
                          <Badge variant="outline">{risk.risk_category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Likelihood: <span className="capitalize font-medium">{risk.likelihood}</span></span>
                          <span>Impact: <span className="capitalize font-medium">{risk.impact}</span></span>
                          <span>Risk Score: <span className="font-semibold">{getRiskScore()}/9</span></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          risk.status === "mitigated" ? "default" :
                          risk.status === "realized" ? "destructive" :
                          "secondary"
                        }>
                          {risk.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditRisk(risk)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-foreground">Mitigation:</span>{' '}
                        <span className="text-muted-foreground">{risk.mitigation_strategy}</span>
                      </p>
                      {risk.contingency_plan && (
                        <p>
                          <span className="font-medium text-foreground">Contingency:</span>{' '}
                          <span className="text-muted-foreground">{risk.contingency_plan}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Allocation */}
      <ResourceAllocation />
    </div>
  );
}
