import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flag, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";

interface TimelineTrackerProps {
  initiativeId: string;
  stage: "implement" | "monitor";
}

export function TimelineTracker({ initiativeId, stage }: TimelineTrackerProps) {
  const { milestones, isLoading } = useTimelineMilestones(initiativeId);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading timeline...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  // Filter milestones relevant to current stage
  const relevantMilestones = milestones.filter(m => {
    if (stage === "implement") {
      return m.sub_stage === "installation" || m.sub_stage === "initial_implementation";
    } else {
      return true; // Monitor shows all milestones
    }
  });
  
  const completedMilestones = relevantMilestones.filter(m => m.status === "completed").length;
  const progressPercentage = relevantMilestones.length > 0 
    ? Math.round((completedMilestones / relevantMilestones.length) * 100)
    : 0;
  
  const getMilestoneStatus = (milestone: any) => {
    if (milestone.status === "completed") return "completed";
    if (milestone.status === "cancelled") return "cancelled";
    const targetDate = parseISO(milestone.target_date);
    if (isPast(targetDate)) return "overdue";
    if (isFuture(targetDate)) return "upcoming";
    return "on-track";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "upcoming":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="default"><Flag className="h-3 w-3 mr-1" />On Track</Badge>;
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <CardTitle>Implementation Timeline (from Plan Stage)</CardTitle>
        </div>
        <CardDescription>
          Track milestone progress and key dates from your implementation plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Milestone Progress</span>
            <span className="text-muted-foreground">{completedMilestones} of {relevantMilestones.length}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progressPercentage}% of {stage === "implement" ? "implementation" : "all"} milestones completed
          </p>
        </div>
        
        {/* Milestone List */}
        <div className="space-y-3">
          {relevantMilestones.length > 0 ? (
            relevantMilestones.map((milestone) => {
              const status = getMilestoneStatus(milestone);
              
              return (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg border ${
                    status === "completed" ? "bg-green-50 border-green-200" :
                    status === "overdue" ? "bg-red-50 border-red-200" :
                    "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(status)}
                        <Badge variant="outline" className="text-xs">
                          {milestone.phase}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{milestone.milestone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {format(parseISO(milestone.target_date), "MMM d, yyyy")}
                        {milestone.completion_date && (
                          <span className="ml-2">
                            • Completed: {format(parseISO(milestone.completion_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {milestone.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {milestone.notes}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No milestones defined yet in your implementation plan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
