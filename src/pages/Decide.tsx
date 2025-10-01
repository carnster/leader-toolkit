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
import { InitiativeTemplateSelector } from "@/components/InitiativeTemplateSelector";
import { useInitiatives } from "@/hooks/useInitiatives";
import { MasterChecklist } from "@/components/MasterChecklist";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { EBPRecommendations } from "@/components/EBPRecommendations";

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
  
  // Initiative creation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState({ title: "", description: "" });
  
  // Form state
  const [problemStatement, setProblemStatement] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [baselineData, setBaselineData] = useState("");
  const [rootCauses, setRootCauses] = useState("");
  const [equityNotes, setEquityNotes] = useState("");
  const [stakeholderInput, setStakeholderInput] = useState("");
  const [chosenApproach, setChosenApproach] = useState("");
  const [evidenceBase, setEvidenceBase] = useState("");
  const [feasibilityScore, setFeasibilityScore] = useState<number>(0);
  const [leadingIndicators, setLeadingIndicators] = useState("");
  const [laggingIndicators, setLaggingIndicators] = useState("");
  const [measurementTimeline, setMeasurementTimeline] = useState("");
  
  // Load existing decision brief
  useEffect(() => {
    if (decisionBrief) {
      setProblemStatement(decisionBrief.problem_statement || "");
      setTargetGroup(decisionBrief.target_group || "");
      setBaselineData(decisionBrief.baseline_data || "");
      setRootCauses(decisionBrief.root_causes?.join(", ") || "");
      setEquityNotes(decisionBrief.equity_notes || "");
      setStakeholderInput(decisionBrief.stakeholder_input || "");
      setChosenApproach(decisionBrief.chosen_approach || "");
      setEvidenceBase(decisionBrief.evidence_base || "");
      setFeasibilityScore(decisionBrief.feasibility_score || 0);
      setLeadingIndicators(decisionBrief.leading_indicators?.join(", ") || "");
      setLaggingIndicators(decisionBrief.lagging_indicators?.join(", ") || "");
      setMeasurementTimeline(decisionBrief.measurement_timeline || "");
      
      // Checklist is now auto-calculated, no need to load it
    }
  }, [decisionBrief]);

  // Auto-calculate checklist completion based on form data
  const isStep1Complete = problemStatement && targetGroup && baselineData && rootCauses;
  const isStep2Complete = equityNotes && stakeholderInput;
  const isStep3Complete = chosenApproach && evidenceBase && feasibilityScore > 0;
  const isStep4Complete = leadingIndicators && laggingIndicators && measurementTimeline;
  
  const autoCheckedItems = {
    "identified-need": !!isStep1Complete,
    "evidence-approach": !!isStep3Complete,
    "implementation-requirements": !!isStep3Complete,
    "barriers-enablers": !!(isStep2Complete && isStep3Complete),
    "feasibility": !!isStep3Complete,
  };
  
  const completionRate = (Object.values(autoCheckedItems).filter(Boolean).length / 5) * 100;
  
  const handleSaveProgress = () => {
    if (!effectiveInitiativeId) {
      toast({
        title: "No initiative selected",
        description: "Please create or select an initiative first.",
        variant: "destructive",
      });
      return;
    }
    
    upsertDecisionBrief({
      initiative_id: effectiveInitiativeId,
      problem_statement: problemStatement,
      target_group: targetGroup,
      baseline_data: baselineData,
      root_causes: rootCauses ? rootCauses.split(",").map(s => s.trim()) : null,
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
    
    // Save final decision brief
    handleSaveProgress();
    
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
    createInitiative({
      title: newInitiative.title,
      description: newInitiative.description,
      stage: "decide",
      status: "active",
    });
    setNewInitiative({ title: "", description: "" });
    setDialogOpen(false);
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
              <span className="text-muted-foreground">Step {step} of 4</span>
              <span className="font-medium">{Math.round((step / 4) * 100)}%</span>
            </div>
            <Progress value={(step / 4) * 100} className="h-2" />
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

      {/* Step 2: Equity & Stakeholder Voice */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Step 2: Equity & Stakeholder Considerations</CardTitle>
            </div>
            <CardDescription>
              Whose voices have been heard? What are the equity implications?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Consider who might be disproportionately affected by this problem</li>
                <li>Identify any barriers to access or participation</li>
                <li>Document input from teachers, pupils, families, and leaders</li>
                <li>Ensure diverse perspectives are represented in your planning</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equity">Equity Implications</Label>
              <Textarea
                id="equity"
                placeholder="Who might be disproportionately affected? Are there barriers to access?..."
                rows={4}
                value={equityNotes}
                onChange={(e) => setEquityNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stakeholders">Stakeholder Input</Label>
              <Textarea
                id="stakeholders"
                placeholder="What have you heard from teachers, pupils, families, and leaders?..."
                rows={4}
                value={stakeholderInput}
                onChange={(e) => setStakeholderInput(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>
            </div>

            <div className="rounded-lg border border-accent/50 bg-accent/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Implementation Guidance: Engage Behaviours</p>
                  <p className="text-sm text-muted-foreground">
                    Actively seek diverse perspectives. Consider who might be missing from the conversation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fit & Feasibility */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Step 3: Fit & Feasibility Assessment</CardTitle>
            </div>
            <CardDescription>
              Is this approach right for your context? Can you implement it well?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-medium mb-2">What to do in this step:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Name the specific approach or intervention you plan to use</li>
                <li>Document the research or evidence supporting this approach</li>
                <li>Assess your capacity: time, skills, resources, and leadership support</li>
                <li>Rate your confidence in each feasibility factor honestly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approach">Chosen Approach</Label>
              <Input
                id="approach"
                placeholder="e.g., Evidence-based intervention framework"
                value={chosenApproach}
                onChange={(e) => setChosenApproach(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence Base</Label>
              <Textarea
                id="evidence"
                placeholder="What research or evidence supports this approach?..."
                rows={3}
                value={evidenceBase}
                onChange={(e) => setEvidenceBase(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Feasibility Factors (rate your confidence)</Label>
              <div className="space-y-4">
                {[
                  { factor: "Time available", description: "Do we have sufficient time?" },
                  { factor: "Staff capacity", description: "Do we have the right skills?" },
                  { factor: "Resource availability", description: "Do we have materials/budget?" },
                  { factor: "Leadership support", description: "Is there active backing?" },
                ].map((item) => (
                  <div key={item.factor} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.factor}</p>
                        <p className="text-muted-foreground text-xs">{item.description}</p>
                      </div>
                      <select className="rounded-md border px-2 py-1">
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

      {/* Step 4: Success Metrics */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Step 4: Success Metrics & Measurement Plan</CardTitle>
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
                placeholder="e.g., Implementation fidelity, attendance rates, weekly progress checks..."
                rows={3}
                value={leadingIndicators}
                onChange={(e) => setLeadingIndicators(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lagging">Lagging Indicators (outcome measures)</Label>
              <Textarea
                id="lagging"
                placeholder="e.g., End-of-term assessments, standardized measures, outcome data..."
                rows={3}
                value={laggingIndicators}
                onChange={(e) => setLaggingIndicators(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Measurement Timeline</Label>
              <Input
                id="timeline"
                placeholder="When will you check each indicator?"
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

      {/* AI Recommendations */}
      <EBPRecommendations 
        decisionBrief={decisionBrief}
        onSelectRecommendation={(rec) => {
          setChosenApproach(rec.name + ": " + rec.description);
          setEvidenceBase(rec.evidence_level + " evidence. " + rec.implementation_notes);
        }}
      />
      
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
      
      {/* Master Checklist - Decide stage */}
      <MasterChecklist stage="explore" initiativeId={effectiveInitiativeId} autoCheckedItems={autoCheckedItems} />
      
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
          {step < 4 ? (
            <Button onClick={() => setStep(Math.min(4, step + 1))}>
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
    </div>
  );
}
