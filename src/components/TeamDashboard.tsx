import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertTriangle, CheckCircle, Calendar, MessageSquare, Target, Shield } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { TimelineMilestone } from "@/hooks/useTimelineMilestones";
import { ImplementationRisk } from "@/hooks/useImplementationRisks";
import { CommunicationActivity } from "@/hooks/useCommunicationActivities";

interface TeamDashboardProps {
  teamMembers: TeamMember[];
  strategies: ImplementationStrategy[];
  milestones: TimelineMilestone[];
  risks: ImplementationRisk[];
  communicationActivities: CommunicationActivity[];
}

interface MemberWorkload {
  member: TeamMember;
  strategies: number;
  milestones: number;
  risks: number;
  communications: number;
  total: number;
  capacityLevel: "low" | "moderate" | "high" | "overloaded";
}

export function TeamDashboard({
  teamMembers,
  strategies,
  milestones,
  risks,
  communicationActivities,
}: TeamDashboardProps) {
  const getCapacityLevel = (total: number): MemberWorkload["capacityLevel"] => {
    if (total === 0) return "low";
    if (total <= 3) return "moderate";
    if (total <= 6) return "high";
    return "overloaded";
  };

  const getCapacityColor = (level: MemberWorkload["capacityLevel"]) => {
    switch (level) {
      case "low": return "text-muted-foreground";
      case "moderate": return "text-green-600";
      case "high": return "text-yellow-600";
      case "overloaded": return "text-destructive";
    }
  };

  const getCapacityBadgeVariant = (level: MemberWorkload["capacityLevel"]) => {
    switch (level) {
      case "low": return "secondary";
      case "moderate": return "default";
      case "high": return "default";
      case "overloaded": return "destructive";
    }
  };

  const workloadData: MemberWorkload[] = teamMembers.map(member => {
    const memberStrategies = strategies.filter(s => s.responsible_party_id === member.id).length;
    const memberMilestones = milestones.filter(m => m.owner_id === member.id).length;
    const memberRisks = risks.filter(r => r.owner_id === member.id).length;
    const memberCommunications = communicationActivities.filter(c => c.assigned_to_id === member.id).length;
    const total = memberStrategies + memberMilestones + memberRisks + memberCommunications;

    return {
      member,
      strategies: memberStrategies,
      milestones: memberMilestones,
      risks: memberRisks,
      communications: memberCommunications,
      total,
      capacityLevel: getCapacityLevel(total),
    };
  });

  const overloadedMembers = workloadData.filter(w => w.capacityLevel === "overloaded");
  const totalAssignments = strategies.length + milestones.length + risks.length + communicationActivities.length;
  const assignedItems = workloadData.reduce((sum, w) => sum + w.total, 0);
  const unassignedItems = totalAssignments - assignedItems;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Team Workload Dashboard</CardTitle>
          </div>
          <CardDescription>
            Track team member capacity and assignment distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team Size</span>
              </div>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
              <p className="text-xs text-muted-foreground">Active members</p>
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned Items</span>
              </div>
              <p className="text-2xl font-bold">{assignedItems}</p>
              <p className="text-xs text-muted-foreground">
                {totalAssignments > 0 ? Math.round((assignedItems / totalAssignments) * 100) : 0}% of total
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Unassigned</span>
              </div>
              <p className="text-2xl font-bold">{unassignedItems}</p>
              <p className="text-xs text-muted-foreground">Items need owners</p>
            </div>
          </div>

          {/* Capacity Warnings */}
          {overloadedMembers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">{overloadedMembers.length} team member{overloadedMembers.length > 1 ? 's are' : ' is'} overloaded:</span>
                {' '}
                {overloadedMembers.map(w => w.member.name || w.member.profiles?.full_name).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {/* Team Member Cards */}
          <div className="space-y-4">
            <h3 className="font-semibold">Team Members</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {workloadData.map(workload => (
                <Card key={workload.member.id} className="animate-fade-in">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {workload.member.name || workload.member.profiles?.full_name || "Unnamed Member"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {workload.member.role_in_initiative}
                        </CardDescription>
                      </div>
                      <Badge variant={getCapacityBadgeVariant(workload.capacityLevel)}>
                        {workload.total} {workload.total === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Workload Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className={getCapacityColor(workload.capacityLevel)}>
                          {workload.capacityLevel === "low" && "Available"}
                          {workload.capacityLevel === "moderate" && "Moderate"}
                          {workload.capacityLevel === "high" && "High"}
                          {workload.capacityLevel === "overloaded" && "Overloaded"}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((workload.total / 7) * 100, 100)} 
                        className="h-2"
                      />
                    </div>

                    {/* Assignment Breakdown */}
                    {workload.total > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                        {workload.strategies > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{workload.strategies} {workload.strategies === 1 ? 'Strategy' : 'Strategies'}</span>
                          </div>
                        )}
                        {workload.milestones > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{workload.milestones} {workload.milestones === 1 ? 'Milestone' : 'Milestones'}</span>
                          </div>
                        )}
                        {workload.risks > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{workload.risks} {workload.risks === 1 ? 'Risk' : 'Risks'}</span>
                          </div>
                        )}
                        {workload.communications > 0 && (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{workload.communications} {workload.communications === 1 ? 'Activity' : 'Activities'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {workload.total === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No assignments yet
                      </p>
                    )}

                    {/* Responsibilities */}
                    {workload.member.responsibilities && workload.member.responsibilities.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1.5">Responsibilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {workload.member.responsibilities.slice(0, 3).map((resp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {resp}
                            </Badge>
                          ))}
                          {workload.member.responsibilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{workload.member.responsibilities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
