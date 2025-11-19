import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lightbulb, Plus, Edit, Loader2 } from "lucide-react";
import { CommunicationPlan } from "@/components/CommunicationPlan";
import { PDRecommendations } from "@/components/PDRecommendations";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@/hooks/useTeamMembers";
import type { PDActivity } from "@/hooks/usePDActivities";

interface TeamCapacitySectionProps {
  initiativeId: string;
  teamMembers: TeamMember[];
  pdActivities: PDActivity[];
  isLoadingTeam: boolean;
  isLoadingPD: boolean;
  isGeneratingPD: boolean;
  onAddTeamMember: () => void;
  onEditTeamMember: (member: TeamMember) => void;
  onAddPDActivity: (activity?: Partial<PDActivity>) => void;
  onEditPDActivity: (activity: PDActivity) => void;
  onGeneratePD: () => void;
}

export function TeamCapacitySection({
  initiativeId,
  teamMembers,
  pdActivities,
  isLoadingTeam,
  isLoadingPD,
  isGeneratingPD,
  onAddTeamMember,
  onEditTeamMember,
  onAddPDActivity,
  onEditPDActivity,
  onGeneratePD,
}: TeamCapacitySectionProps) {
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const { toast } = useToast();

  const handleApplyPDRecommendations = async (recommendations: any[]) => {
    try {
      for (const activity of recommendations) {
        await onAddPDActivity(activity);
      }
      toast({
        title: "PD activities created",
        description: `Successfully added ${recommendations.length} professional development activities.`,
      });
    } catch (error) {
      console.error("Error applying PD recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to create some PD activities.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Implementation Team</CardTitle>
            </div>
            <Button onClick={onAddTeamMember}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          <CardDescription>
            Build a diverse team with clear roles and responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeam ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Add members to get started.</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {(member.profiles?.full_name || member.name || 'U')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.profiles?.full_name || member.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{member.role_in_initiative}</p>
                      {member.responsibilities && member.responsibilities.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.responsibilities.slice(0, 2).join(', ')}
                          {member.responsibilities.length > 2 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditTeamMember(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Development */}
      <PDRecommendations
        initiativeId={initiativeId}
        activeIngredients={activeIngredients}
        teamMembers={teamMembers}
        onApplyRecommendations={handleApplyPDRecommendations}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Professional Development Activities</CardTitle>
            </div>
            <Button onClick={() => onAddPDActivity()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
          <CardDescription>
            Comprehensive training, coaching, and ongoing support aligned to fidelity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPD ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading activities...</p>
          ) : pdActivities.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No PD activities yet.</p>
              <p className="text-xs text-muted-foreground">
                Generate AI recommendations or schedule training sessions manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pdActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant="outline" className="capitalize">
                          {activity.activity_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        activity.completion_status === "completed" ? "default" :
                        activity.completion_status === "cancelled" ? "destructive" :
                        "secondary"
                      }>
                        {activity.completion_status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditPDActivity(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {activity.duration_minutes && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{' '}
                        <span className="font-medium">{activity.duration_minutes} min</span>
                      </div>
                    )}
                    {activity.facilitator && (
                      <div>
                        <span className="text-muted-foreground">Facilitator:</span>{' '}
                        <span className="font-medium">{activity.facilitator}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Plan */}
      <CommunicationPlan initiativeId={initiativeId} />
    </div>
  );
}
