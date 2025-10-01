import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Calendar, Shield, Lightbulb, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useImplementationRisks } from "@/hooks/useImplementationRisks";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AddActiveIngredientDialog } from "@/components/AddActiveIngredientDialog";
import { EditActiveIngredientDialog } from "@/components/EditActiveIngredientDialog";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { MilestoneDialog } from "@/components/MilestoneDialog";
import { RiskDialog } from "@/components/RiskDialog";
import { PDActivityDialog } from "@/components/PDActivityDialog";
import { ImplementationStrategyDialog } from "@/components/ImplementationStrategyDialog";
import { MasterChecklist } from "@/components/MasterChecklist";
import { ERICStrategySelector } from "@/components/ERICStrategySelector";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import type { TeamMember } from "@/hooks/useTeamMembers";
import type { TimelineMilestone } from "@/hooks/useTimelineMilestones";
import type { ImplementationRisk } from "@/hooks/useImplementationRisks";
import type { PDActivity } from "@/hooks/usePDActivities";
import type { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { format } from "date-fns";


export default function Plan() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  const { activeIngredients, isLoading } = useActiveIngredients(effectiveInitiativeId);
  const { teamMembers, isLoading: isLoadingTeam } = useTeamMembers(effectiveInitiativeId);
  const { milestones, isLoading: isLoadingMilestones } = useTimelineMilestones(effectiveInitiativeId);
  const { risks, isLoading: isLoadingRisks } = useImplementationRisks(effectiveInitiativeId);
  const { activities, isLoading: isLoadingActivities } = usePDActivities(effectiveInitiativeId);
  const { strategies, isLoading: isLoadingStrategies, createStrategy, updateStrategy, deleteStrategy } = useImplementationStrategies(effectiveInitiativeId);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingIngredient, setEditingIngredient] = useState<ActiveIngredient | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TimelineMilestone | null>(null);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<ImplementationRisk | null>(null);
  const [pdDialogOpen, setPdDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PDActivity | null>(null);
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<ImplementationStrategy | null>(null);

  // Check for template and auto-populate active ingredients
  useEffect(() => {
    const templateId = sessionStorage.getItem("templateId");
    
    if (templateId && effectiveInitiativeId) {
      loadTemplateIngredients(templateId, effectiveInitiativeId);
    }
  }, [effectiveInitiativeId]);

  const loadTemplateIngredients = async (templateId: string, initiativeId: string) => {
    try {
      const { data: template, error } = await supabase
        .from("initiative_templates" as any)
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      
      const templateData = template as any;
      if (templateData && templateData.active_ingredients) {
        // If this initiative already has ingredients, skip seeding
        const { count, error: countError } = await supabase
          .from("active_ingredients")
          .select("id", { count: "exact", head: true })
          .eq("initiative_id", initiativeId);
        if (countError) throw countError;
        if ((count ?? 0) > 0) {
          // Already populated; clear the template marker and exit
          sessionStorage.removeItem("templateId");
          return;
        }

        // Create active ingredients from template
        const ingredients = templateData.active_ingredients.map((ing: any) => ({
          initiative_id: initiativeId,
          name: ing.name,
          description: ing.description,
          is_core: ing.is_core,
          category: ing.category || null,
          look_fors: ing.look_fors || null,
          adaptable_boundaries: ing.adaptable_boundaries || null,
        }));

        const { error: insertError } = await supabase
          .from("active_ingredients")
          .insert(ingredients);

        if (insertError) throw insertError;

        // Invalidate and refetch the query
        await queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });

        toast({
          title: "Active ingredients loaded",
          description: `${ingredients.length} components added from template`,
        });
      }

      // Clear sessionStorage after loading
      sessionStorage.removeItem("templateId");
    } catch (error) {
      console.error("Error loading template ingredients:", error);
    }
  };

  const displayIngredients = activeIngredients;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FileText className="h-4 w-4" />
          <span>Stage 2: Plan and Prepare</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Plan and Prepare Stage</h1>
        <p className="text-muted-foreground mt-2">
          Design a comprehensive implementation plan using human- and learning-centered design principles
        </p>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              What to do in the Plan and Prepare Stage
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Identify active ingredients:</strong> Define core (non-negotiable) and adaptable components</li>
              <li>• <strong>Select implementation strategies:</strong> Use ERIC framework (Enable, Redesign, Integrate, Create)</li>
              <li>• <strong>Build your implementation team:</strong> Assemble diverse stakeholders with clear roles</li>
              <li>• <strong>Plan professional learning:</strong> Design ongoing, job-embedded development opportunities</li>
              <li>• <strong>Develop monitoring systems:</strong> Create fidelity measures and "look-fors" for quality implementation</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ingredients">Active Ingredients</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="pd">Professional Development</TabsTrigger>
        </TabsList>

        {/* Active Ingredients Tab */}
        <TabsContent value="ingredients" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle>Active Ingredients Mapper</CardTitle>
                </div>
                {effectiveInitiativeId && <AddActiveIngredientDialog initiativeId={effectiveInitiativeId} />}
              </div>
              <CardDescription>
                Define core practices (non-negotiable) and adaptable elements. Each ingredient should have clear look-fors for fidelity monitoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading active ingredients...</p>
              ) : displayIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active ingredients yet. Add components to get started.</p>
              ) : (
                displayIngredients.map((ingredient) => {
                  const ing = ingredient as any;
                  return (
                    <div key={ingredient.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{ingredient.name}</h4>
                            {(ing.is_core ?? ing.isCore) ? (
                              <Badge variant="default">Core</Badge>
                            ) : (
                              <Badge variant="secondary">Adaptable</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{ingredient.category}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingIngredient(ingredient)}
                      >
                        Edit
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Look-Fors & Fidelity Measures</CardTitle>
              <CardDescription>
                What should observers see when this is implemented well?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayIngredients.filter(i => {
                  const ing = i as any;
                  return ing.is_core ?? ing.isCore;
                }).map((ingredient) => {
                  const ing = ingredient as any;
                  return (
                    <div key={ingredient.id} className="rounded-lg border p-3">
                      <p className="font-medium text-sm mb-2">{ingredient.name}</p>
                      {ing.look_fors && ing.look_fors.length > 0 ? (
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          {ing.look_fors.map((lookFor: string, idx: number) => (
                            <li key={idx}>• {lookFor}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Implementation happening as planned</li>
                          <li>• All participants actively engaged</li>
                          <li>• Core practices being followed</li>
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Strategies Tab */}
        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Implementation Strategies (ERIC Framework)</CardTitle>
                </div>
                <Button onClick={() => {
                  setEditingStrategy(null);
                  setStrategyDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Strategy
                </Button>
              </div>
              <CardDescription>
                Use the ERIC framework to plan strategies that Enable, Redesign, Integrate, and Create supports for implementation success.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStrategies ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading strategies...</p>
              ) : strategies.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">No implementation strategies yet. Use the ERIC framework to plan:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Enable</strong> - Train, educate, provide tools</li>
                    <li><strong>Redesign</strong> - Modify workflows, systems, structures</li>
                    <li><strong>Integrate</strong> - Make it part of standard practice</li>
                    <li><strong>Create</strong> - Develop new policies, teams, resources</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-6">
                  {["enable", "redesign", "integrate", "create"].map((category) => {
                    const categoryStrategies = strategies.filter(s => s.eric_category === category);
                    if (categoryStrategies.length === 0) return null;
                    
                    const categoryLabels = {
                      enable: "Enable - Support capacity building",
                      redesign: "Redesign - Adjust context",
                      integrate: "Integrate - Embed in routine",
                      create: "Create - Build new supports"
                    };
                    
                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold mb-3 text-primary">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </h3>
                        <div className="space-y-3">
                          {categoryStrategies.map((strategy) => (
                            <div key={strategy.id} className="rounded-lg border p-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{strategy.strategy_name}</h4>
                                    <Badge variant={
                                      strategy.status === "completed" ? "default" :
                                      strategy.status === "in_progress" ? "secondary" :
                                      strategy.status === "on_hold" ? "outline" : "secondary"
                                    }>
                                      {strategy.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  {strategy.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                                    {strategy.target_barrier && (
                                      <div><strong>Barrier:</strong> {strategy.target_barrier}</div>
                                    )}
                                    {strategy.timeline && (
                                      <div><strong>Timeline:</strong> {strategy.timeline}</div>
                                    )}
                                    {strategy.resources_needed && (
                                      <div><strong>Resources:</strong> {strategy.resources_needed}</div>
                                    )}
                                    {strategy.success_indicators && (
                                      <div><strong>Success:</strong> {strategy.success_indicators}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEditingStrategy(strategy);
                                      setStrategyDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Delete this strategy?")) {
                                        deleteStrategy(strategy.id);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Implementation Team</CardTitle>
                </div>
                <Button onClick={() => setTeamDialogOpen(true)}>
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
                          {member.profiles?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{member.profiles?.full_name || 'Unknown User'}</p>
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
                        onClick={() => {
                          setEditingTeamMember(member);
                          setTeamDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Implementation Timeline</CardTitle>
                </div>
                <Button onClick={() => setMilestoneDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </div>
              <CardDescription>
                Track implementation phases with clear milestones and completion dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMilestones ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading milestones...</p>
              ) : milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No milestones yet. Add milestones to track progress.</p>
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
                          <Badge variant={
                            milestone.status === "completed" ? "default" :
                            milestone.status === "in_progress" ? "secondary" :
                            milestone.status === "at_risk" ? "destructive" :
                            "outline"
                          }>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setEditingMilestone(milestone);
                            setMilestoneDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Risk Register</CardTitle>
                </div>
                <Button onClick={() => setRiskDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Risk
                </Button>
              </div>
              <CardDescription>
                Proactively identify barriers with mitigation strategies and contingency plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRisks ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading risks...</p>
              ) : risks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No risks documented yet. Add potential risks to plan ahead.</p>
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
                          <Badge variant={
                            risk.status === "mitigated" ? "default" :
                            risk.status === "realized" ? "destructive" :
                            "secondary"
                          }>
                            {risk.status}
                          </Badge>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingRisk(risk);
                            setRiskDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Development Tab */}
        <TabsContent value="pd" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Professional Development Plan</CardTitle>
                <Button onClick={() => setPdDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
              <CardDescription>
                Comprehensive training, coaching, and ongoing support aligned to fidelity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No PD activities yet. Schedule training and support sessions.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
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
                        <Badge variant={
                          activity.completion_status === "completed" ? "default" :
                          activity.completion_status === "cancelled" ? "destructive" :
                          "secondary"
                        }>
                          {activity.completion_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {activity.scheduled_date && (
                          <div>
                            <span className="text-muted-foreground">Date:</span>{' '}
                            <span className="font-medium">{format(new Date(activity.scheduled_date), "MMM dd, yyyy")}</span>
                          </div>
                        )}
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
                        {activity.attendance_count && (
                          <div>
                            <span className="text-muted-foreground">Attendance:</span>{' '}
                            <span className="font-medium">{activity.attendance_count}</span>
                          </div>
                        )}
                      </div>
                      {activity.target_audience && activity.target_audience.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Audience:</span>{' '}
                          <span className="font-medium">{activity.target_audience.join(', ')}</span>
                        </div>
                      )}
                      {activity.fidelity_focus && activity.fidelity_focus.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fidelity Focus:</span>{' '}
                          <span className="font-medium">{activity.fidelity_focus.join(', ')}</span>
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingActivity(activity);
                          setPdDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline">Save as Draft</Button>
        <Button>Complete Planning & Move to Implement</Button>
      </div>

      {/* Master Checklist */}
      <MasterChecklist stage="prepare" initiativeId={effectiveInitiativeId} />

      {/* ERIC Strategies Library */}
      <ERICStrategySelector />

      {/* Edit Ingredient Dialog */}
      {editingIngredient && effectiveInitiativeId && (
        <EditActiveIngredientDialog
          ingredient={editingIngredient}
          open={!!editingIngredient}
          onOpenChange={(open) => !open && setEditingIngredient(null)}
          initiativeId={effectiveInitiativeId}
        />
      )}
      
      {effectiveInitiativeId && (
        <>
          <TeamMemberDialog
            member={editingTeamMember || undefined}
            open={teamDialogOpen}
            onOpenChange={(open) => {
              setTeamDialogOpen(open);
              if (!open) setEditingTeamMember(null);
            }}
            initiativeId={effectiveInitiativeId}
          />
          
          <MilestoneDialog
            milestone={editingMilestone || undefined}
            open={milestoneDialogOpen}
            onOpenChange={(open) => {
              setMilestoneDialogOpen(open);
              if (!open) setEditingMilestone(null);
            }}
            initiativeId={effectiveInitiativeId}
          />
          
          <RiskDialog
            risk={editingRisk || undefined}
            open={riskDialogOpen}
            onOpenChange={(open) => {
              setRiskDialogOpen(open);
              if (!open) setEditingRisk(null);
            }}
            initiativeId={effectiveInitiativeId}
          />
          
          <PDActivityDialog
            activity={editingActivity || undefined}
            open={pdDialogOpen}
            onOpenChange={(open) => {
              setPdDialogOpen(open);
              if (!open) setEditingActivity(null);
            }}
            initiativeId={effectiveInitiativeId}
          />
          
          <ImplementationStrategyDialog
            strategy={editingStrategy}
            open={strategyDialogOpen}
            onOpenChange={(open) => {
              setStrategyDialogOpen(open);
              if (!open) setEditingStrategy(null);
            }}
            onSave={(strategy) => {
              if (editingStrategy) {
                updateStrategy({ id: editingStrategy.id, ...strategy });
              } else {
                createStrategy(strategy);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
