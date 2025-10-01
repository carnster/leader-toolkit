import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Target, Lightbulb, Plus, CheckCircle2, TrendingUp, BarChart, AlertCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InitiativeTemplateSelector } from "@/components/InitiativeTemplateSelector";
import { useInitiatives } from "@/hooks/useInitiatives";
import { MasterChecklist } from "@/components/MasterChecklist";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { EBPRecommendations } from "@/components/EBPRecommendations";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const exploreChecklist = [
  { id: "identified-need", text: "Problem & target pupils defined", required: true },
  { id: "evidence-approach", text: "Evidence-based approach selected", required: true },
  { id: "barriers-enablers", text: "Barriers & enablers identified", required: true },
  { id: "feasibility", text: "Feasibility assessed", required: true },
];

export default function Decide() {
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInitiative, isCreating } = useInitiatives();
  
  // Get initiative ID
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  // Decision brief hook
  const { decisionBrief, upsertDecisionBrief, isSaving } = useDecisionBrief(effectiveInitiativeId || undefined);
  
  // Team members hook
  const { teamMembers, isLoading: isLoadingTeam } = useTeamMembers(effectiveInitiativeId || undefined);
  
  // Initiative creation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [skipWarningOpen, setSkipWarningOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState({ title: "", description: "" });
  
  // Form state
  const [problemStatement, setProblemStatement] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [baselineData, setBaselineData] = useState("");
  const [rootCauses, setRootCauses] = useState("");
  const [goals, setGoals] = useState("");
  const [equityNotes, setEquityNotes] = useState("");
  const [stakeholderInput, setStakeholderInput] = useState("");
  const [chosenApproach, setChosenApproach] = useState("");
  const [evidenceBase, setEvidenceBase] = useState("");
  const [feasibilityScore, setFeasibilityScore] = useState<number>(0);
  const [leadingIndicators, setLeadingIndicators] = useState("");
  const [laggingIndicators, setLaggingIndicators] = useState("");
  const [measurementTimeline, setMeasurementTimeline] = useState("");
  const [goalsEvaluation, setGoalsEvaluation] = useState<any>(null);
  const [isEvaluatingGoals, setIsEvaluatingGoals] = useState(false);
  
  // Load existing decision brief
  useEffect(() => {
    if (decisionBrief) {
      setProblemStatement(decisionBrief.problem_statement || "");
      setTargetGroup(decisionBrief.target_group || "");
      setBaselineData(decisionBrief.baseline_data || "");
      setRootCauses(decisionBrief.root_causes?.join(", ") || "");
      setGoals(decisionBrief.goals || "");
      setEquityNotes(decisionBrief.equity_notes || "");
      setStakeholderInput(decisionBrief.stakeholder_input || "");
      setChosenApproach(decisionBrief.chosen_approach || "");
      setEvidenceBase(decisionBrief.evidence_base || "");
      setFeasibilityScore(decisionBrief.feasibility_score || 0);
      setLeadingIndicators(decisionBrief.leading_indicators?.join(", ") || "");
      setLaggingIndicators(decisionBrief.lagging_indicators?.join(", ") || "");
      setMeasurementTimeline(decisionBrief.measurement_timeline || "");
      setGoalsEvaluation(decisionBrief.goals_feedback || null);
    }
  }, [decisionBrief]);

  const handleEvaluateGoals = async () => {
    if (!goals || !goals.trim()) {
      toast({
        title: "No goals to evaluate",
        description: "Please enter your initiative goals first.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluatingGoals(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-goals", {
        body: { goals }
      });

      if (error) throw error;

      if (data?.evaluation) {
        setGoalsEvaluation(data.evaluation);
        
        // Save evaluation to database
        if (effectiveInitiativeId) {
          await supabase
            .from("decision_briefs")
            .update({ goals_feedback: data.evaluation })
            .eq("initiative_id", effectiveInitiativeId);
        }

        toast({
          title: "Goals evaluated",
          description: `Overall score: ${data.evaluation.overall_score}/100`,
        });
      }
    } catch (error: any) {
      console.error("Error evaluating goals:", error);
      toast({
        title: "Evaluation failed",
        description: error.message || "Failed to evaluate goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluatingGoals(false);
    }
  };

  // Auto-calculate checklist completion based on form data
  const isStep1Complete = problemStatement && targetGroup && baselineData && rootCauses; // Problem Definition
  const isStep2Complete = teamMembers.length > 0; // Team Assembly
  const isStep3Complete = goals && goals.length > 0; // Goal Development
  const isStep4Complete = chosenApproach && evidenceBase; // Solution Selection
  const isStep5Complete = stakeholderInput && equityNotes && feasibilityScore > 0; // Readiness & Feasibility
  const isStep6Complete = leadingIndicators && laggingIndicators && measurementTimeline; // Success Metrics
  
  // Step completion validation
  const getStepCompletion = (stepNumber: number): boolean => {
    switch(stepNumber) {
      case 1: return !!isStep1Complete;
      case 2: return !!isStep2Complete;
      case 3: return !!isStep3Complete;
      case 4: return !!isStep4Complete;
      case 5: return !!isStep5Complete;
      case 6: return !!isStep6Complete;
      default: return false;
    }
  };
  
  const getStepName = (stepNumber: number): string => {
    switch(stepNumber) {
      case 1: return "Problem Definition";
      case 2: return "Team Assembly";
      case 3: return "Goal Development";
      case 4: return "Solution Selection";
      case 5: return "Readiness & Feasibility";
      case 6: return "Success Metrics";
      default: return "Unknown Step";
    }
  };
  
  const handleNextStep = () => {
    if (!getStepCompletion(step)) {
      setSkipWarningOpen(true);
      return;
    }
    setStep(Math.min(6, step + 1));
  };
  
  const confirmSkipStep = () => {
    setStep(Math.min(6, step + 1));
    setSkipWarningOpen(false);
  };
  
  const autoCheckedItems = {
    "identified-need": !!isStep1Complete,
    "team-assembled": !!isStep2Complete,
    "goals-defined": !!isStep3Complete,
    "evidence-approach": !!isStep4Complete,
    "barriers-enablers": !!isStep5Complete,
    "feasibility": !!isStep5Complete,
  };
  
  const completionRate = (Object.values(autoCheckedItems).filter(Boolean).length / 6) * 100;
  
  const handleSaveProgress = async (): Promise<boolean> => {
    let idToUse = effectiveInitiativeId;

    // If no initiative selected, create one automatically so saving works seamlessly
    if (!idToUse) {
      const { data: authInfo } = await supabase.auth.getUser();
      if (!authInfo.user) {
        toast({
          title: "Not signed in",
          description: "Please sign in to save your progress.",
          variant: "destructive",
        });
        return false;
      }

      const fallbackTitle = newInitiative.title?.trim() ||
        (problemStatement ? `${problemStatement.slice(0, 40)}...` : `Initiative - ${new Date().toLocaleDateString()}`);

      const { data: created, error: createErr } = await supabase
        .from("initiatives")
        .insert({
          title: fallbackTitle,
          description: newInitiative.description || null,
          stage: "decide",
          status: "active",
          owner_id: authInfo.user.id,
        })
        .select()
        .single();

      if (createErr || !created) {
        toast({
          title: "No initiative selected",
          description: "Please create or select an initiative first.",
          variant: "destructive",
        });
        setDialogOpen(true);
        return false;
      }

      idToUse = created.id;
      try {
        sessionStorage.setItem("initiativeId", created.id);
      } catch {}
      navigate(`/decide?initiative=${created.id}`);
    }

    // Verify the initiative exists and the user has access before saving
    const { data: initiative, error: initError } = await supabase
      .from("initiatives")
      .select("id")
      .eq("id", idToUse)
      .maybeSingle();

    if (initError || !initiative) {
      toast({
        title: "Initiative not found",
        description: "Please create or select an initiative before saving.",
        variant: "destructive",
      });
      setDialogOpen(true);
      return false;
    }

    upsertDecisionBrief({
      initiative_id: idToUse,
      problem_statement: problemStatement,
      target_group: targetGroup,
      baseline_data: baselineData,
      root_causes: rootCauses ? rootCauses.split(",").map(s => s.trim()) : null,
      goals: goals,
      equity_notes: equityNotes,
      stakeholder_input: stakeholderInput,
      chosen_approach: chosenApproach,
      evidence_base: evidenceBase,
      feasibility_score: feasibilityScore || null,
      leading_indicators: leadingIndicators ? leadingIndicators.split(",").map(s => s.trim()) : null,
      lagging_indicators: laggingIndicators ? laggingIndicators.split(",").map(s => s.trim()) : null,
      measurement_timeline: measurementTimeline,
      checklist_completed: completionRate === 100,
    });

    return true;
  };
  
  const handleAdoptInitiative = async () => {
    if (completionRate < 100) {
      toast({
        title: "Checklist incomplete",
        description: "Please complete all required checklist items before adopting this initiative.",
        variant: "destructive",
      });
      return;
    }
    
    // Save final decision brief (ensures initiative exists too)
    const saved = await handleSaveProgress();
    if (!saved) return;
    
    // Update initiative stage to plan
    const { error } = await supabase
      .from("initiatives")
      .update({ stage: "plan" })
      .eq("id", effectiveInitiativeId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update initiative stage.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Initiative adopted! 🎉",
      description: "Decision brief complete. Moving to Plan & Prepare stage.",
    });
    
    // Navigate to Plan page
    setTimeout(() => {
      navigate(`/plan?initiative=${effectiveInitiativeId}`);
    }, 1500);
  };

  const handleCreateInitiative = () => {
    createInitiative(
      {
        title: newInitiative.title,
        description: newInitiative.description,
        stage: "decide",
        status: "active",
      },
      {
        onSuccess: (created: any) => {
          try {
            if (created?.id) {
              sessionStorage.setItem("initiativeId", created.id);
              navigate(`/decide?initiative=${created.id}`);
            }
          } catch {}
          setNewInitiative({ title: "", description: "" });
          setDialogOpen(false);
        },
      }
    );
  };

  // Check for template on mount
  useEffect(() => {
    const templateId = sessionStorage.getItem("templateId");
    const initiativeId = searchParams.get("initiative");
    
    if (templateId && initiativeId) {
      loadTemplateData(templateId, initiativeId);
    }
  }, [searchParams]);

  const loadTemplateData = async (templateId: string, initiativeId: string) => {
    try {
      const { data: template, error } = await supabase
        .from("initiative_templates" as any)
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      
      const templateData = template as any;
      if (templateData && templateData.decision_brief_template) {
        const brief = templateData.decision_brief_template;
        setProblemStatement(brief.problem_statement || "");
        setTargetGroup(brief.target_group || "");
        setMeasurementTimeline(brief.measurement_timeline || "");
        setLeadingIndicators(brief.leading_indicators?.join(", ") || "");
        setLaggingIndicators(brief.lagging_indicators?.join(", ") || "");
      }

      toast({
        title: "Template loaded",
        description: "Decision brief pre-filled from template",
      });

      // Keep templateId for Plan page to import active ingredients
      // sessionStorage.removeItem("templateId");
    } catch (error) {
      console.error("Error loading template:", error);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Search className="h-4 w-4" />
            <span>Stage 1: Decide</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Decide Stage</h1>
          <p className="text-muted-foreground mt-2">
            Make informed decisions about what changes to implement based on evidence and organizational readiness
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Initiative
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Initiative</DialogTitle>
              <DialogDescription>
                Start a new school improvement initiative
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <InitiativeTemplateSelector />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or start from scratch</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newInitiative.title}
                  onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                  placeholder="e.g., Student Support Initiative"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                  placeholder="Brief description of the initiative..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateInitiative}
                disabled={!newInitiative.title || isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Initiative"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* IMPACT Framework Guidance */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            IMPACT Framework: Decide Stage Essentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Key Activities for This Stage:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• <strong>Assemble your implementation team:</strong> Include diverse stakeholders with expertise</li>
              <li>• <strong>Name the problem and need for change (the why):</strong> Be specific about what needs improvement</li>
              <li>• <strong>Develop the goal:</strong> Create measurable, time-bound objectives</li>
              <li>• <strong>Identify evidence-based solutions:</strong> Select practices with proven effectiveness</li>
              <li>• <strong>Consider fit and feasibility:</strong> Match the solution to your context and capacity</li>
              <li>• <strong>Assess organizational readiness:</strong> Evaluate resources, climate, and support systems</li>
            </ul>
          </div>
          <div className="rounded-lg bg-background/50 p-3 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Remember:</strong> Implementation is a learning process. Involving implementers from the start builds ownership and increases the likelihood of success. Use this stage to ensure everyone understands <em>why</em> this change matters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wizard Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of 6</span>
              <span className="font-medium">{Math.round((step / 6) * 100)}%</span>
            </div>
            <Progress value={(step / 6) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Problem Definition */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Step 1: Define the Priority Problem</CardTitle>
            </div>
            <CardDescription>
              What specific challenge are you addressing? Who are the target pupils?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Clearly articulate the specific problem you're trying to solve</li>
                <li>Identify which pupils or groups are most affected</li>
                <li>Gather and document baseline data showing the current state</li>
                <li>Consider the root causes contributing to this problem</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="problem">Problem Statement</Label>
              <Textarea
                id="problem"
                placeholder="Example: Year 9 students are not meeting expected progress in mathematics. Only 45% of students achieved age-related expectations in autumn term assessments, compared to 62% in Year 8. This gap is particularly pronounced for disadvantaged pupils (32% vs 48%)."
                rows={5}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                <strong>Be specific:</strong> State what's happening, for whom, and the measurable impact
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Pupil Group</Label>
              <Input
                id="target"
                placeholder="Example: Year 9 students, particularly disadvantaged pupils in Sets 2 and 3 (approximately 65 students)"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Specify year group, demographics, class/set, or other defining characteristics
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseline">Baseline Data</Label>
              <Textarea
                id="baseline"
                placeholder="Example: Autumn 2024 end-of-term assessments show 45% at expected standard. Teacher observations indicate 60% of students lack confidence in problem-solving. Attendance data shows target group has 89% attendance vs 94% whole-school average. Parent survey indicates 35% of families feel they can support maths homework."
                rows={4}
                value={baselineData}
                onChange={(e) => setBaselineData(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Include quantitative data (test scores, attendance) and qualitative insights (observations, surveys)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Label htmlFor="rootCauses">Root Causes</Label>
                <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-2 flex-1">
                  <p className="font-medium">How to identify root causes:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li><strong>Use the "5 Whys" technique:</strong> Keep asking "why" to dig deeper</li>
                    <li><strong>Look at multiple data sources:</strong> Academic, behavioral, attendance, surveys</li>
                    <li><strong>Involve stakeholders:</strong> Ask teachers, pupils, and families</li>
                    <li><strong>Consider systemic factors:</strong> Resources, training, time, culture</li>
                    <li><strong>Distinguish symptoms from causes:</strong> Low scores are symptoms; lack of practice is a cause</li>
                  </ol>
                </div>
              </div>
              <Textarea
                id="rootCauses"
                placeholder="Example: Limited differentiation in lessons (teacher feedback), Insufficient retrieval practice built into schemes of work (curriculum review), Lack of targeted intervention for students falling behind (progress data analysis), Parent uncertainty about how to support at home (parent survey)"
                rows={4}
                value={rootCauses}
                onChange={(e) => setRootCauses(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                List underlying factors that contribute to the problem. Each should be evidence-based.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Team Assembly */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Step 2: Assemble Your Implementation Team</CardTitle>
            </div>
            <CardDescription>
              Include diverse stakeholders with expertise. Who needs to be involved from the start?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Identify key stakeholders who should be involved: teachers, leaders, support staff</li>
                <li>Include those who will implement the change and those affected by it</li>
                <li>Consider diverse perspectives and expertise needed</li>
                <li>Document roles and why each person is important to the team</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Implementation Team Members</Label>
                  <Button onClick={() => setTeamDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
                
                {isLoadingTeam ? (
                  <p className="text-sm text-muted-foreground">Loading team members...</p>
                ) : teamMembers.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">
                        No team members added yet. Click "Add Member" to build your implementation team.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {(member.profiles?.full_name || member.name || '??')
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{member.profiles?.full_name || member.name || 'Unknown'}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTeamDialogOpen(true)}
                                >
                                  Edit
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{member.role_in_initiative}</p>
                              {member.responsibilities && member.responsibilities.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Responsibilities:</p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {member.responsibilities.map((resp, idx) => (
                                      <li key={idx}>{resp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mt-2">
                  Include key stakeholders who will implement and support this initiative. Add their roles and specific responsibilities.
                </p>
              </div>
            </div>
            
            <div className="rounded-lg border border-accent/50 bg-accent/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Implementation Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Involving implementers from the start builds ownership and increases the likelihood of success. Include those who will make it happen daily.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Goal Development */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Step 3: Develop Clear Goals</CardTitle>
            </div>
            <CardDescription>
              Create measurable, time-bound objectives. What will success look like?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Make goals SMART: Specific, Measurable, Achievable, Relevant, Time-bound</li>
                <li>Connect goals directly to your identified problem</li>
                <li>Include both process goals (what you'll do) and outcome goals (what will change)</li>
                <li>Be ambitious but realistic given your context and capacity</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goals">Initiative Goals</Label>
              <Textarea
                id="goals"
                placeholder="Example: By July 2025, increase the percentage of Year 9 disadvantaged pupils achieving age-related expectations in maths from 32% to 50%. Achieve 90% fidelity to the mastery learning framework by March 2025 as measured by classroom observations. Increase student confidence in problem-solving from baseline of 40% to 70% by summer term..."
                rows={6}
                value={goals}
                onChange={(e) => {
                  setGoals(e.target.value);
                  setGoalsEvaluation(null); // Clear evaluation when goals change
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  State specific, measurable goals with clear timelines and target numbers
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEvaluateGoals}
                  disabled={isEvaluatingGoals || !goals.trim()}
                >
                  {isEvaluatingGoals ? "Evaluating..." : "Evaluate Goals"}
                </Button>
              </div>
            </div>

            {/* Goals Evaluation Feedback */}
            {goalsEvaluation && (
              <Card className={
                goalsEvaluation.is_smartie_compliant 
                  ? "border-green-500/50 bg-green-500/5" 
                  : goalsEvaluation.is_smart_compliant 
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : "border-destructive/50 bg-destructive/5"
              }>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {goalsEvaluation.is_smartie_compliant ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Excellent SMARTIE Goals
                      </>
                    ) : goalsEvaluation.is_smart_compliant ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Good SMART Goals (Consider SMARTIE)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        Goals Need Improvement
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Overall Score: <span className="font-bold text-lg">{goalsEvaluation.overall_score}/100</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Criteria Scores */}
                  <div>
                    <h4 className="font-medium mb-2">Criteria Breakdown:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(goalsEvaluation.criteria_scores).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                          <span className={`font-medium ${value >= 70 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                            {value}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  {goalsEvaluation.strengths?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">Strengths:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {goalsEvaluation.strengths.map((strength: string, idx: number) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {goalsEvaluation.improvements?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-destructive">Suggested Improvements:</h4>
                      <div className="space-y-3">
                        {goalsEvaluation.improvements.map((improvement: any, idx: number) => (
                          <div key={idx} className="p-3 rounded bg-background/50 space-y-1">
                            <p className="font-medium text-sm">{improvement.criterion}</p>
                            <p className="text-sm text-muted-foreground">{improvement.issue}</p>
                            <p className="text-sm text-primary">💡 {improvement.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improved Version */}
                  {goalsEvaluation.improved_version && (
                    <div>
                      <h4 className="font-medium mb-2">Suggested Improved Version:</h4>
                      <div className="p-3 rounded bg-background/50 text-sm whitespace-pre-wrap">
                        {goalsEvaluation.improved_version}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setGoals(goalsEvaluation.improved_version)}
                      >
                        Use This Version
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Solution Selection */}
      {step === 4 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Step 2: Solution Selection</CardTitle>
              </div>
              <CardDescription>
                Have we selected an evidence-informed approach that meets pupil needs and is suitable for our setting?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h4 className="font-medium mb-2">What to do in this step:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Name the specific approach or intervention you plan to use</li>
                  <li>Document the research or evidence supporting this approach</li>
                  <li>Consider using AI recommendations or selecting from templates</li>
                  <li>Ensure the approach matches your identified problem and context</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="approach">Chosen Approach</Label>
                <Input
                  id="approach"
                  placeholder="Example: Mastery Learning framework for Year 9 maths"
                  value={chosenApproach}
                  onChange={(e) => setChosenApproach(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Name the specific program, practice, or intervention you will implement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence Base</Label>
                <Textarea
                  id="evidence"
                  placeholder="Example: EEF Teaching and Learning Toolkit shows +5 months progress for mastery learning. Research from [source] demonstrates effectiveness with similar student populations..."
                  rows={4}
                  value={evidenceBase}
                  onChange={(e) => setEvidenceBase(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Cite research, trials, or evidence that supports this approach
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Progress"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations for Solution Selection */}
          <EBPRecommendations 
            decisionBrief={decisionBrief}
            onSelectRecommendation={(rec) => {
              setChosenApproach(rec.name + ": " + rec.description);
              setEvidenceBase(rec.evidence_level + " evidence. " + rec.implementation_notes);
            }}
          />
        </>
      )}

      {/* Step 5: Readiness & Feasibility */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Step 5: Assess Organizational Readiness & Feasibility</CardTitle>
            </div>
            <CardDescription>
              Evaluate resources, climate, support systems, and whether the approach fits your context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Evaluate organizational readiness: resources, culture, leadership support</li>
                <li>Document equity considerations and diverse stakeholder perspectives</li>
                <li>Identify potential barriers to implementation and existing enablers</li>
                <li>Assess whether the approach fits your specific context and capacity</li>
                <li>Rate your confidence in feasibility factors honestly</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stakeholders">Stakeholder Input & Organizational Context</Label>
              <Textarea
                id="stakeholders"
                placeholder="Example: Year 9 teachers expressed need for better differentiation resources. Parents want more guidance on supporting maths at home. SLT committed to protecting PPA time for planning. School culture supports trying new approaches. Previous initiatives showed strong staff engagement when properly supported..."
                rows={4}
                value={stakeholderInput}
                onChange={(e) => setStakeholderInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Document stakeholder perspectives and organizational context
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equity">Equity & Access Considerations</Label>
              <Textarea
                id="equity"
                placeholder="Example: Disadvantaged pupils are disproportionately affected by this problem (32% vs 48% at expected). We need to ensure intervention doesn't create additional barriers. Translation of materials needed for EAL families. Consider timing to avoid clash with Ramadan..."
                rows={4}
                value={equityNotes}
                onChange={(e) => setEquityNotes(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Consider who might be disproportionately affected, barriers to access, and how to ensure equity
              </p>
            </div>

            <div className="space-y-3">
              <Label>Feasibility Assessment (1-10 confidence rating)</Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Overall Feasibility Score</p>
                      <p className="text-muted-foreground text-xs">How confident are you this can be implemented successfully?</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={feasibilityScore}
                      onChange={(e) => setFeasibilityScore(parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                </div>

                {[
                  { factor: "Time & Scheduling", description: "Sufficient time for planning, training, and delivery?" },
                  { factor: "Staff Capacity & Skills", description: "Staff have or can develop needed expertise?" },
                  { factor: "Resources & Budget", description: "Materials, funding, and space available?" },
                  { factor: "Leadership Support", description: "Active backing and protection from competing priorities?" },
                  { factor: "School Culture & Climate", description: "Culture supportive of change and innovation?" },
                ].map((item) => (
                  <div key={item.factor} className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.factor}</p>
                        <p className="text-muted-foreground text-xs">{item.description}</p>
                      </div>
                      <select className="rounded-md border px-3 py-1.5 bg-background">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Success Metrics */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Step 4: Feasibility Assessment</CardTitle>
            </div>
            <CardDescription>
              Is the approach feasible to implement in our setting?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Assess your capacity: time, skills, resources, and leadership support</li>
                <li>Rate your confidence in each feasibility factor honestly</li>
                <li>Consider both immediate and long-term sustainability</li>
                <li>Be realistic about what your setting can manage</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Label>Feasibility Factors (rate your confidence 1-10)</Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Overall Feasibility Score</p>
                      <p className="text-muted-foreground text-xs">How confident are you that this approach can be implemented successfully?</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={feasibilityScore}
                      onChange={(e) => setFeasibilityScore(parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                </div>

                {[
                  { factor: "Time available", description: "Do we have sufficient time for planning and delivery?" },
                  { factor: "Staff capacity & skills", description: "Do staff have or can they develop the needed skills?" },
                  { factor: "Resource availability", description: "Are materials, budget, and space available?" },
                  { factor: "Leadership support", description: "Is there active backing and protection from competing priorities?" },
                ].map((item) => (
                  <div key={item.factor} className="rounded-lg border p-3 bg-muted/30">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.factor}</p>
                        <p className="text-muted-foreground text-xs">{item.description}</p>
                      </div>
                      <select className="rounded-md border px-3 py-1.5 bg-background">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Success Metrics */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Step 6: Success Metrics & Measurement Plan</CardTitle>
            </div>
            <CardDescription>
              How will you know if it's working? Define leading and lagging indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Leading indicators:</strong> Early signals that show implementation is happening (e.g., attendance, fidelity checks)</li>
                <li><strong>Lagging indicators:</strong> Outcome measures showing the impact (e.g., assessment results, behavior data)</li>
                <li>Create a timeline for when you'll measure each indicator</li>
                <li>Ensure metrics are specific, measurable, and aligned to your problem</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leading">Leading Indicators (early signals)</Label>
              <Textarea
                id="leading"
                placeholder="Example: Teacher completion of mastery lesson plans (weekly), Student attendance at intervention sessions (weekly), Fidelity observations using our rubric (fortnightly), Staff confidence surveys (half-termly)"
                rows={3}
                value={leadingIndicators}
                onChange={(e) => setLeadingIndicators(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lagging">Lagging Indicators (outcome measures)</Label>
              <Textarea
                id="lagging"
                placeholder="Example: End of half-term maths assessments (% at expected standard), Student confidence surveys (termly), Progress data vs autumn baseline, Standardized test scores (summer term)"
                rows={3}
                value={laggingIndicators}
                onChange={(e) => setLaggingIndicators(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Measurement Timeline</Label>
              <Input
                id="timeline"
                placeholder="Example: Weekly fidelity checks, half-termly review meetings, termly outcome reporting to governors"
                value={measurementTimeline}
                onChange={(e) => setMeasurementTimeline(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Checklist - Decide stage */}
      <MasterChecklist stage="decide" initiativeId={effectiveInitiativeId} autoCheckedItems={autoCheckedItems} />
      
      {/* Next Stage Preview */}
      <Card className="border-secondary/30 bg-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg">Ready for Plan & Prepare?</CardTitle>
          <CardDescription>
            Once your decision brief is complete, move to the Plan stage to:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>Define active ingredients (core & adaptable components) based on your chosen approach</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>Select ERIC implementation strategies to address identified barriers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>Build your implementation team with roles and responsibilities</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>Create a timeline with milestones from your measurement plan</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Skip Step Warning Dialog */}
      <AlertDialog open={skipWarningOpen} onOpenChange={setSkipWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Step Incomplete</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't completed <strong>{getStepName(step)}</strong>. Skipping this step may impact your implementation plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 px-6">
            <div className="rounded-lg bg-destructive/10 p-3 space-y-2">
              <p className="font-semibold text-destructive">Potential Impact:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Missing critical information for decision-making</li>
                <li>Incomplete decision brief documentation</li>
                <li>Reduced likelihood of implementation success</li>
                <li>Difficulty tracking progress and outcomes</li>
              </ul>
            </div>
            <p className="text-sm">
              Do you want to skip this step anyway, or go back and complete it?
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back & Complete</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkipStep} className="bg-destructive hover:bg-destructive/90">
              Skip Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Navigation & Adoption */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous Step
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>
          {step < 6 ? (
            <Button onClick={handleNextStep}>
              Next Step
            </Button>
          ) : (
            <Button 
              disabled={completionRate < 100 || !effectiveInitiativeId}
              onClick={handleAdoptInitiative}
              className="bg-primary"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Adopt Initiative & Move to Plan
            </Button>
          )}
        </div>
      </div>

      <TeamMemberDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        initiativeId={effectiveInitiativeId || ""}
      />
    </div>
  );
}
