import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Users, Calendar, Target, Plus, Edit, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCommunicationActivities } from "@/hooks/useCommunicationActivities";
import { CommunicationActivityDialog } from "./CommunicationActivityDialog";
import { CommunicationRecommendations } from "./CommunicationRecommendations";
import type { CommunicationActivity } from "@/hooks/useCommunicationActivities";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useToast } from "@/hooks/use-toast";
import { PlanCalendarView } from "./PlanCalendarView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CommunicationPlanProps {
  initiativeId: string;
}

export function CommunicationPlan({ initiativeId }: CommunicationPlanProps) {
  const { activities, isLoading, updateActivity, createActivity } = useCommunicationActivities(initiativeId);
  const { decisionBrief } = useDecisionBrief(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CommunicationActivity | undefined>();

  const handleAddActivity = () => {
    setSelectedActivity(undefined);
    setDialogOpen(true);
  };

  const handleEditActivity = (activity: CommunicationActivity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleToggleComplete = (activity: CommunicationActivity) => {
    updateActivity({
      id: activity.id,
      completed: !activity.completed,
      completed_date: !activity.completed ? format(new Date(), "yyyy-MM-dd") : null,
    });
  };

  const handleApplyRecommendations = (recommendations: Array<{
    stakeholder_group: string;
    activity_type: string;
    description: string;
    channel: string;
    timing: string;
  }>) => {
    recommendations.forEach(rec => {
      createActivity({
        stakeholder_group: rec.stakeholder_group,
        activity_type: rec.activity_type,
        description: rec.description,
        channel: rec.channel,
        scheduled_date: null,
        notes: `Timing: ${rec.timing}`,
      });
    });
    
    toast({
      title: "Activities Added",
      description: `${recommendations.length} communication activities have been added to your plan.`,
    });
  };

  const groupedActivities = activities.reduce((acc, activity) => {
    const group = activity.stakeholder_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(activity);
    return acc;
  }, {} as Record<string, CommunicationActivity[]>);

  const completedCount = activities.filter(a => a.completed).length;
  
  // Convert activities to calendar events
  const calendarEvents = activities
    .filter(a => a.scheduled_date)
    .map(a => ({
      id: a.id,
      title: a.description,
      date: parseISO(a.scheduled_date!),
      type: "communication" as const,
      status: a.completed ? "completed" : "scheduled"
    }));
  
  return (
    <>
      {/* AI Recommendations */}
      {decisionBrief && (
        <CommunicationRecommendations
          decisionBrief={{
            problem_statement: decisionBrief.problem_statement,
            target_group: decisionBrief.target_group,
            goals: decisionBrief.goals || undefined,
            chosen_approach: decisionBrief.chosen_approach || undefined,
            stakeholder_input: decisionBrief.stakeholder_input || undefined,
            equity_notes: decisionBrief.equity_notes || undefined,
          }}
          teamMembers={teamMembers?.map(tm => ({
            name: tm.name || undefined,
            role_in_initiative: tm.role_in_initiative,
          }))}
          onApplyRecommendations={handleApplyRecommendations}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Communication & Stakeholder Engagement</CardTitle>
              </div>
              <CardDescription className="mt-1.5">
                Strategic communication to build awareness, buy-in, and sustained support
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {activities.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {completedCount} of {activities.length} completed
                </div>
              )}
              <Button onClick={handleAddActivity} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium text-lg mb-1">No communication activities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start planning your stakeholder engagement strategy
                </p>
                <Button onClick={handleAddActivity} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Activity
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([group, groupActivities]) => (
                <div key={group}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {group}
                  </h4>
                  <div className="space-y-2">
                    {groupActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={activity.completed}
                            onCheckedChange={() => handleToggleComplete(activity)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {activity.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {activity.activity_type}
                                  </Badge>
                                  {activity.channel && (
                                    <Badge variant="secondary" className="text-xs">
                                      {activity.channel}
                                    </Badge>
                                  )}
                                  {activity.scheduled_date && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(activity.scheduled_date), "MMM d, yyyy")}
                                    </span>
                                  )}
                                  {activity.completed && activity.completed_date && (
                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Completed {format(new Date(activity.completed_date), "MMM d")}
                                    </span>
                                  )}
                                </div>
                                {activity.notes && (
                                  <p className="text-xs text-muted-foreground mt-2">{activity.notes}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditActivity(activity)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reference Guide - shown when there are activities */}
          {activities.length > 0 && (
            <div className="pt-6 border-t">
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Communication Best Practices</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-2 rounded text-xs border">
                  <span className="font-medium">Early Involvement: </span>
                  <span className="text-muted-foreground">Engage stakeholders in planning</span>
                </div>
                <div className="p-2 rounded text-xs border">
                  <span className="font-medium">Share Successes: </span>
                  <span className="text-muted-foreground">Celebrate wins and progress</span>
                </div>
                <div className="p-2 rounded text-xs border">
                  <span className="font-medium">Transparent Data: </span>
                  <span className="text-muted-foreground">Share successes and challenges</span>
                </div>
                <div className="p-2 rounded text-xs border">
                  <span className="font-medium">Two-way: </span>
                  <span className="text-muted-foreground">Seek feedback actively</span>
                </div>
              </div>
            </div>
          )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <PlanCalendarView events={calendarEvents} />
            </TabsContent>
        </CardContent>
      </Card>

      <CommunicationActivityDialog
        activity={selectedActivity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initiativeId={initiativeId}
        teamMembers={teamMembers}
      />
    </>
  );
}
