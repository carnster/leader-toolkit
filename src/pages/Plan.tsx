import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useImplementationRisks } from "@/hooks/useImplementationRisks";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { EditActiveIngredientDialog } from "@/components/EditActiveIngredientDialog";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { MilestoneDialog } from "@/components/MilestoneDialog";
import { RiskDialog } from "@/components/RiskDialog";
import { PDActivityDialog } from "@/components/PDActivityDialog";
import { ImplementationStrategyDialog } from "@/components/ImplementationStrategyDialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PlanSidebar } from "@/components/PlanSidebar";
import { OverviewSection } from "@/components/plan/OverviewSection";
import { StrategicFoundationSection } from "@/components/plan/StrategicFoundationSection";
import { TeamCapacitySection } from "@/components/plan/TeamCapacitySection";
import { ExecutionPlanningSection } from "@/components/plan/ExecutionPlanningSection";
import { QualityAssuranceSection } from "@/components/plan/QualityAssuranceSection";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import type { TeamMember } from "@/hooks/useTeamMembers";
import type { TimelineMilestone } from "@/hooks/useTimelineMilestones";
import type { ImplementationRisk } from "@/hooks/useImplementationRisks";
import type { PDActivity } from "@/hooks/usePDActivities";
import type { ImplementationStrategy } from "@/hooks/useImplementationStrategies";

export default function Plan() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  const currentSection = searchParams.get("section") || "overview";
  
  const { activeIngredients, isLoading, createIngredient } = useActiveIngredients(effectiveInitiativeId);
  const [isGeneratingIngredients, setIsGeneratingIngredients] = useState(false);
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false);
  const [isGeneratingRisks, setIsGeneratingRisks] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isGeneratingPD, setIsGeneratingPD] = useState(false);
  const [isGeneratingFullPlan, setIsGeneratingFullPlan] = useState(false);
  
  const { teamMembers, isLoading: isLoadingTeam } = useTeamMembers(effectiveInitiativeId);
  const { milestones, isLoading: isLoadingMilestones, createMilestone, deleteMilestone } = useTimelineMilestones(effectiveInitiativeId);
  const { risks, isLoading: isLoadingRisks, createRisk } = useImplementationRisks(effectiveInitiativeId);
  const { activities, isLoading: isLoadingActivities, createActivity } = usePDActivities(effectiveInitiativeId);
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
        const { count, error: countError } = await supabase
          .from("active_ingredients")
          .select("id", { count: "exact", head: true })
          .eq("initiative_id", initiativeId);
        if (countError) throw countError;
        if ((count ?? 0) > 0) {
          sessionStorage.removeItem("templateId");
          return;
        }

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
        await queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });
        toast({ title: "Active ingredients loaded", description: `${ingredients.length} components added from template` });
      }
      sessionStorage.removeItem("templateId");
    } catch (error) {
      console.error("Error loading template ingredients:", error);
    }
  };

  const loadAIIngredients = async (ingredientsJson: string, initiativeId: string) => {
    try {
      const ingredients = JSON.parse(ingredientsJson);
      const { count, error: countError } = await supabase
        .from("active_ingredients")
        .select("id", { count: "exact", head: true })
        .eq("initiative_id", initiativeId);
      
      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        sessionStorage.removeItem("aiRecommendationIngredients");
        return;
      }

      const formattedIngredients = ingredients.map((ing: any) => ({
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
        .insert(formattedIngredients);

      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });
      toast({ title: "Active ingredients loaded", description: `${formattedIngredients.length} components added from AI recommendation` });
      sessionStorage.removeItem("aiRecommendationIngredients");
    } catch (error) {
      console.error("Error loading AI ingredients:", error);
    }
  };

  useEffect(() => {
    const templateId = sessionStorage.getItem("templateId");
    const aiIngredients = sessionStorage.getItem("aiRecommendationIngredients");
    
    if (templateId && effectiveInitiativeId) {
      loadTemplateIngredients(templateId, effectiveInitiativeId);
    } else if (aiIngredients && effectiveInitiativeId) {
      loadAIIngredients(aiIngredients, effectiveInitiativeId);
    }
  }, [effectiveInitiativeId]);

  // AI Generation Functions
  const generateIngredientsFromApproach = async () => {
    if (!effectiveInitiativeId) return;
    setIsGeneratingIngredients(true);
    try {
      const { data: brief, error: briefError } = await supabase
        .from("decision_briefs")
        .select("chosen_approach, evidence_base, problem_statement")
        .eq("initiative_id", effectiveInitiativeId)
        .single();

      if (briefError || !brief?.chosen_approach) {
        toast({ title: "No approach found", description: "Please complete the Decide stage first with a chosen approach.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-active-ingredients", {
        body: { chosenApproach: brief.chosen_approach, evidenceBase: brief.evidence_base, problemStatement: brief.problem_statement },
      });

      if (error) throw error;

      if (data?.active_ingredients && data.active_ingredients.length > 0) {
        for (const ing of data.active_ingredients) {
          await createIngredient({
            name: ing.name,
            description: ing.description,
            is_core: ing.is_core,
            category: ing.category,
            look_fors: ing.look_fors || [],
            adaptable_boundaries: ing.adaptable_boundaries || [],
          });
        }
        toast({ title: "Active ingredients generated!", description: `${data.active_ingredients.length} components added from your chosen approach.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate active ingredients.", variant: "destructive" });
    } finally {
      setIsGeneratingIngredients(false);
    }
  };

  const generateStrategiesFromDecisionBrief = async () => {
    if (!effectiveInitiativeId) return;
    setIsGeneratingStrategies(true);
    try {
      const { data: brief, error: briefError } = await supabase.from("decision_briefs").select("*").eq("initiative_id", effectiveInitiativeId).single();
      if (briefError || !brief) {
        toast({ title: "No decision brief found", description: "Please complete the Decide stage first.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("recommend-strategies", { body: { decisionBrief: brief } });
      if (error) throw error;

      if (data?.strategies && data.strategies.length > 0) {
        for (const strategy of data.strategies) {
          createStrategy({
            strategy_name: strategy.strategy_name,
            eric_category: strategy.eric_category,
            description: strategy.description,
            target_barrier: strategy.target_barrier,
            timeline: strategy.timeline || null,
            resources_needed: strategy.resources_needed || null,
            success_indicators: strategy.success_indicators || null,
            responsible_party: null,
            status: 'planned',
          });
        }
        toast({ title: "Implementation strategies generated!", description: `${data.strategies.length} ERIC strategies added based on your feasibility assessment.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate implementation strategies.", variant: "destructive" });
    } finally {
      setIsGeneratingStrategies(false);
    }
  };

  const generateRisksFromDecisionBrief = async () => {
    if (!effectiveInitiativeId) return;
    setIsGeneratingRisks(true);
    try {
      const { data: brief } = await supabase.from("decision_briefs").select("*").eq("initiative_id", effectiveInitiativeId).single();
      if (!brief) throw new Error("No decision brief found");

      const { data, error } = await supabase.functions.invoke("recommend-risks", { body: { decisionBrief: brief } });
      if (error) throw error;
      
      if (data?.risks) {
        for (const risk of data.risks) {
          createRisk({
            risk_description: risk.risk_description,
            risk_category: risk.risk_category,
            likelihood: risk.likelihood,
            impact: risk.impact,
            mitigation_strategy: risk.mitigation_strategy,
            contingency_plan: risk.contingency_plan,
            status: 'active'
          });
        }
        toast({ title: "Risks generated!", description: `${data.risks.length} risks identified from your feasibility data.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingRisks(false);
    }
  };

  const generateTimelineFromContext = async () => {
    if (!effectiveInitiativeId) return;
    setIsGeneratingTimeline(true);
    try {
      const { data: brief } = await supabase.from("decision_briefs").select("*").eq("initiative_id", effectiveInitiativeId).single();
      const { data, error } = await supabase.functions.invoke("recommend-timeline", { body: { decisionBrief: brief, activeIngredients } });
      if (error) throw error;
      
      if (data?.milestones) {
        for (const m of data.milestones) {
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() + m.months_from_start);
          createMilestone({
            milestone: m.milestone,
            phase: m.phase,
            target_date: targetDate.toISOString().split('T')[0],
            notes: m.notes,
            status: 'pending'
          });
        }
        toast({ title: "Timeline generated!", description: `${data.milestones.length} milestones created.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  const generatePDActivities = async () => {
    if (!effectiveInitiativeId) return;
    
    console.log("Starting PD generation with:", { 
      activeIngredientsCount: activeIngredients.length, 
      teamMembersCount: teamMembers.length 
    });
    
    setIsGeneratingPD(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-pd", { 
        body: { 
          activeIngredients, 
          teamMembers 
        } 
      });
      
      console.log("PD generation response:", { data, error });
      
      if (error) {
        console.error("PD generation error:", error);
        throw error;
      }

      if (data?.error) {
        const msg = typeof data.error === 'string' ? data.error : (data.error.message || 'AI service error');
        console.warn('PD generation returned error payload:', data);
        toast({ title: 'AI temporarily unavailable', description: msg, variant: 'destructive' });
        return;
      }
      
      if (data?.activities && data.activities.length > 0) {
        console.log(`Creating ${data.activities.length} PD activities`);
        for (const act of data.activities) {
          createActivity({
            title: act.title,
            activity_type: act.activity_type,
            description: act.description,
            target_audience: act.target_audience,
            duration_minutes: act.duration_minutes,
            fidelity_focus: act.fidelity_focus,
            facilitator: act.facilitator,
            completion_status: 'planned'
          });
        }
        toast({ title: "PD activities generated!", description: `${data.activities.length} activities created.` });
      } else {
        console.warn("No activities returned from AI");
        toast({ title: "No activities generated", description: "The AI didn't return any activities. Please try again.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("PD generation failed:", error);
      toast({ title: "Error generating PD activities", description: error.message || "An unknown error occurred", variant: "destructive" });
    } finally {
      setIsGeneratingPD(false);
    }
  };

  const generateFullPlan = async () => {
    setIsGeneratingFullPlan(true);
    toast({ title: "Generating full plan...", description: "This may take a moment. We'll generate all components in sequence." });
    
    try {
      if (activeIngredients.length === 0) await generateIngredientsFromApproach();
      if (strategies.length === 0) await generateStrategiesFromDecisionBrief();
      if (risks.length === 0) await generateRisksFromDecisionBrief();
      if (milestones.length === 0) await generateTimelineFromContext();
      if (activities.length === 0) await generatePDActivities();
      
      toast({ title: "Full plan generated!", description: "All planning components have been created." });
    } catch (error: any) {
      toast({ title: "Error", description: "Some components failed to generate. Please try individual sections.", variant: "destructive" });
    } finally {
      setIsGeneratingFullPlan(false);
    }
  };

  // Calculate next step
  const getNextStep = (): string => {
    if (activeIngredients.length === 0) return "Start by defining your Active Ingredients (core practices and adaptable elements).";
    if (strategies.length === 0) return "Add Implementation Strategies to address your feasibility barriers.";
    if (teamMembers.length === 0) return "Build your Implementation Team with clear roles.";
    if (milestones.length === 0) return "Create a Timeline with key milestones.";
    if (risks.length === 0) return "Identify and plan for Implementation Risks.";
    if (activities.length === 0) return "Plan Professional Development activities for your team.";
    return "Review all sections and ensure readiness for implementation.";
  };

  // Section rendering
  const renderSection = () => {
    switch (currentSection) {
      case "overview":
        return (
          <OverviewSection
            activeIngredientsCount={activeIngredients.length}
            strategiesCount={strategies.length}
            teamMembersCount={teamMembers.length}
            milestonesCount={milestones.length}
            risksCount={risks.length}
            pdActivitiesCount={activities.length}
            onGenerateFullPlan={generateFullPlan}
            isGenerating={isGeneratingFullPlan}
            nextStep={getNextStep()}
            initiativeId={effectiveInitiativeId}
          />
        );
      
      case "ingredients":
      case "strategies":
        return (
          <StrategicFoundationSection
            activeIngredients={activeIngredients}
            strategies={strategies}
            initiativeId={effectiveInitiativeId}
            isLoadingIngredients={isLoading}
            isLoadingStrategies={isLoadingStrategies}
            isGeneratingIngredients={isGeneratingIngredients}
            isGeneratingStrategies={isGeneratingStrategies}
            onGenerateIngredients={generateIngredientsFromApproach}
            onGenerateStrategies={generateStrategiesFromDecisionBrief}
            onEditIngredient={setEditingIngredient}
            onEditStrategy={(strategy) => {
              setEditingStrategy(strategy);
              setStrategyDialogOpen(true);
            }}
            onDeleteStrategy={(id) => deleteStrategy(id)}
            onAddStrategy={() => {
              setEditingStrategy(null);
              setStrategyDialogOpen(true);
            }}
          />
        );

      case "team":
      case "pd":
      case "communication":
        return (
          <TeamCapacitySection
            initiativeId={effectiveInitiativeId}
            teamMembers={teamMembers}
            pdActivities={activities}
            isLoadingTeam={isLoadingTeam}
            isLoadingPD={isLoadingActivities}
            isGeneratingPD={isGeneratingPD}
            onAddTeamMember={() => {
              setEditingTeamMember(null);
              setTeamDialogOpen(true);
            }}
            onEditTeamMember={(member) => {
              setEditingTeamMember(member);
              setTeamDialogOpen(true);
            }}
            onAddPDActivity={() => {
              setEditingActivity(null);
              setPdDialogOpen(true);
            }}
            onEditPDActivity={(activity) => {
              setEditingActivity(activity);
              setPdDialogOpen(true);
            }}
            onGeneratePD={generatePDActivities}
          />
        );

      case "timeline":
      case "risks":
      case "resources":
        return (
          <ExecutionPlanningSection
            milestones={milestones}
            risks={risks}
            isLoadingMilestones={isLoadingMilestones}
            isLoadingRisks={isLoadingRisks}
            isGeneratingTimeline={isGeneratingTimeline}
            isGeneratingRisks={isGeneratingRisks}
            onAddMilestone={() => {
              setEditingMilestone(null);
              setMilestoneDialogOpen(true);
            }}
            onEditMilestone={(milestone) => {
              setEditingMilestone(milestone);
              setMilestoneDialogOpen(true);
            }}
            onDeleteMilestone={deleteMilestone}
            onAddRisk={() => {
              setEditingRisk(null);
              setRiskDialogOpen(true);
            }}
            onEditRisk={(risk) => {
              setEditingRisk(risk);
              setRiskDialogOpen(true);
            }}
            onGenerateTimeline={generateTimelineFromContext}
            onGenerateRisks={generateRisksFromDecisionBrief}
          />
        );

      case "fidelity":
      case "adaptation":
        return <QualityAssuranceSection activeIngredients={activeIngredients} />;

      default:
        return <OverviewSection activeIngredientsCount={activeIngredients.length} strategiesCount={strategies.length} teamMembersCount={teamMembers.length} milestonesCount={milestones.length} risksCount={risks.length} pdActivitiesCount={activities.length} onGenerateFullPlan={generateFullPlan} isGenerating={isGeneratingFullPlan} nextStep={getNextStep()} initiativeId={effectiveInitiativeId} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PlanSidebar
          completionCounts={{
            ingredients: activeIngredients.length,
            strategies: strategies.length,
            team: teamMembers.length,
            timeline: milestones.length,
            risks: risks.length,
            pd: activities.length,
          }}
        />

        <div className="flex-1 flex flex-col">
          {/* Header with Trigger */}
          <header className="h-16 flex items-center border-b px-6 bg-background">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Plan & Prepare Stage</h1>
                <p className="text-xs text-muted-foreground">Design a comprehensive implementation plan</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-6xl mx-auto">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs */}
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
    </SidebarProvider>
  );
}

