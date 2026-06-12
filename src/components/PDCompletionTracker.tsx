import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePDActivities } from "@/hooks/usePDActivities";
import { parseDateOnly } from "@/lib/dates";
import { GraduationCap, Calendar, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { PDActivityDialog } from "@/components/PDActivityDialog";
import type { PDActivity } from "@/hooks/usePDActivities";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface PDCompletionTrackerProps {
  initiativeId: string;
}

export function PDCompletionTracker({ initiativeId }: PDCompletionTrackerProps) {
  const { activities, isLoading, updateActivity } = usePDActivities(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const [editingActivity, setEditingActivity] = useState<PDActivity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const completedCount = activities?.filter(a => a.completion_status === 'completed').length || 0;
  const totalCount = activities?.length || 0;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const activityTypeLabels: Record<string, string> = {
    initial_training: "Initial Training",
    ongoing_coaching: "Ongoing Coaching",
    collaborative_learning: "Collaborative Learning",
    external_workshop: "External Workshop",
    self_directed: "Self-Directed"
  };

  const statusConfig = {
    planned: { label: "Planned", variant: "outline" as const, icon: Calendar },
    completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
    cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle }
  };

  const handleMarkComplete = async (activity: PDActivity) => {
    await updateActivity({
      id: activity.id,
      completion_status: 'completed'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Professional Development Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-4">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Professional Development Tracker
          </CardTitle>
          <CardDescription>Track training and support activities for implementers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No PD activities scheduled yet</p>
            <p className="text-sm">Add activities in the Plan stage to track them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Professional Development Tracker
              </CardTitle>
              <CardDescription>Track training and support activities for implementers</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedCount}/{totalCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completionPercentage.toFixed(0)}% of PD activities completed
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => {
              const statusInfo = statusConfig[activity.completion_status];
              const StatusIcon = statusInfo.icon;
              
              return (
                <div 
                  key={activity.id} 
                  className="rounded-lg border p-4 space-y-3 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activityTypeLabels[activity.activity_type]}
                        </Badge>
                      </div>
                      
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {activity.scheduled_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {parseDateOnly(activity.scheduled_date).toLocaleDateString()}
                          </div>
                        )}
                        {activity.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration_minutes} min
                          </div>
                        )}
                        {activity.attendance_count && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {activity.attendance_count} attended
                          </div>
                        )}
                      </div>

                      {activity.target_audience && activity.target_audience.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Audience: </span>
                          {activity.target_audience.join(", ")}
                        </div>
                      )}

                      {activity.fidelity_focus && activity.fidelity_focus.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Focus: </span>
                          {activity.fidelity_focus.join(", ")}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {activity.completion_status === 'planned' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(activity)}
                        >
                          Mark Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingActivity(activity);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <PDActivityDialog
        activity={editingActivity || undefined}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingActivity(null);
        }}
        initiativeId={initiativeId}
        teamMembers={teamMembers}
      />
    </>
  );
}
