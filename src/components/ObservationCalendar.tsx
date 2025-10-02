import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Eye, Edit } from "lucide-react";
import { useObservationSchedules } from "@/hooks/useObservationSchedules";
import { ObservationScheduleDialog } from "@/components/ObservationScheduleDialog";
import { ConductObservationDialog } from "@/components/ConductObservationDialog";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import type { ObservationSchedule } from "@/hooks/useObservationSchedules";

interface ObservationCalendarProps {
  initiativeId: string;
}

export function ObservationCalendar({ initiativeId }: ObservationCalendarProps) {
  const { schedules, isLoading } = useObservationSchedules(initiativeId);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [conductDialogOpen, setConductDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ObservationSchedule | undefined>(undefined);
  const [conductingSchedule, setConductingSchedule] = useState<ObservationSchedule | undefined>(undefined);

  const today = startOfDay(new Date());
  const upcomingSchedules = schedules
    .filter(s => s.status === "scheduled" && !isBefore(new Date(s.scheduled_date), today))
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const pastSchedules = schedules
    .filter(s => s.status === "completed")
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    .slice(0, 5);

  const getStatusBadge = (schedule: ObservationSchedule) => {
    const date = new Date(schedule.scheduled_date);
    if (schedule.status === "completed") {
      return <Badge variant="default">Completed</Badge>;
    }
    if (schedule.status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (isToday(date)) {
      return <Badge variant="secondary">Today</Badge>;
    }
    if (isBefore(date, today)) {
      return <Badge variant="outline" className="border-destructive text-destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const getObservationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      direct_observation: "Direct Observation",
      self_report: "Self-Report",
      artifact_review: "Artifact Review",
      coaching_note: "Coaching Note",
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Observation Calendar</CardTitle>
              </div>
              <Button onClick={() => {
                setEditingSchedule(undefined);
                setScheduleDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Observation
              </Button>
            </div>
            <CardDescription>
              Plan and track fidelity observations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading schedule...</p>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No observations scheduled yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Schedule your first observation to start tracking fidelity
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming Observations */}
                <div>
                  <h4 className="font-semibold mb-3">Upcoming Observations</h4>
                  {upcomingSchedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming observations</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSchedules.map((schedule) => (
                        <div key={schedule.id} className="p-4 rounded-lg border space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">
                                  {format(new Date(schedule.scheduled_date), "MMM dd, yyyy")}
                                  {schedule.scheduled_time && ` at ${schedule.scheduled_time}`}
                                </h5>
                                {getStatusBadge(schedule)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getObservationTypeLabel(schedule.observation_type)}
                              </p>
                              {schedule.location && (
                                <p className="text-xs text-muted-foreground">Location: {schedule.location}</p>
                              )}
                              {schedule.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setScheduleDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setConductingSchedule(schedule);
                                  setConductDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Conduct
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Completed */}
                {pastSchedules.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Recent Completed Observations</h4>
                    <div className="space-y-2">
                      {pastSchedules.map((schedule) => (
                        <div key={schedule.id} className="p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(schedule.scheduled_date), "MMM dd, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getObservationTypeLabel(schedule.observation_type)}
                              </p>
                            </div>
                            {getStatusBadge(schedule)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ObservationScheduleDialog
        schedule={editingSchedule}
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setEditingSchedule(undefined);
        }}
        initiativeId={initiativeId}
      />

      <ConductObservationDialog
        schedule={conductingSchedule}
        open={conductDialogOpen}
        onOpenChange={(open) => {
          setConductDialogOpen(open);
          if (!open) setConductingSchedule(undefined);
        }}
        initiativeId={initiativeId}
      />
    </>
  );
}
