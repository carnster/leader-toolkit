import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Search, FileText, Users, Target, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InitiativeTemplateSelector } from "@/components/InitiativeTemplateSelector";
import { useInitiatives } from "@/hooks/useInitiatives";

const exploreChecklist = [
  { id: "problem_defined", text: "Priority problem & target pupils defined with baseline", required: true },
  { id: "equity_considered", text: "Equity implications & stakeholder voices captured", required: true },
  { id: "fit_feasibility", text: "Fit & feasibility assessed; risks noted", required: true },
  { id: "success_metrics", text: "Clear success metrics & measurement plan", required: true },
];

export default function Decide() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInitiative, isCreating } = useInitiatives();
  
  // Initiative creation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState({ title: "", description: "" });
  
  // Form state
  const [problemStatement, setProblemStatement] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [baselineData, setBaselineData] = useState("");
  const [leadingIndicators, setLeadingIndicators] = useState("");
  const [laggingIndicators, setLaggingIndicators] = useState("");
  const [measurementTimeline, setMeasurementTimeline] = useState("");

  const completionRate = (Object.values(checkedItems).filter(Boolean).length / exploreChecklist.length) * 100;

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
          <h1 className="text-3xl font-bold tracking-tight">Decision Brief Wizard</h1>
          <p className="text-muted-foreground">
            Define the problem, assess evidence-fit, and establish success criteria
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
              <CardTitle>Define the Priority Problem</CardTitle>
            </div>
            <CardDescription>
              What specific challenge are you addressing? Who are the target pupils?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="problem">Problem Statement</Label>
              <Textarea
                id="problem"
                placeholder="Describe the core issue you're trying to solve..."
                rows={4}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Be specific: What's happening? For whom? What's the impact?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Pupil Group</Label>
              <Input
                id="target"
                placeholder="e.g., Year 7 pupils, Key Stage 2 students"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseline">Baseline Data</Label>
              <Textarea
                id="baseline"
                placeholder="What does the current data tell you? Include numbers and sources..."
                rows={3}
                value={baselineData}
                onChange={(e) => setBaselineData(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rootCauses">Root Causes</Label>
              <Textarea
                id="rootCauses"
                placeholder="What are the underlying factors contributing to this problem?..."
                rows={3}
              />
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
              <CardTitle>Equity & Stakeholder Considerations</CardTitle>
            </div>
            <CardDescription>
              Whose voices have been heard? What are the equity implications?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="equity">Equity Implications</Label>
              <Textarea
                id="equity"
                placeholder="Who might be disproportionately affected? Are there barriers to access?..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stakeholders">Stakeholder Input</Label>
              <Textarea
                id="stakeholders"
                placeholder="What have you heard from teachers, pupils, families, and leaders?..."
                rows={4}
              />
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
              <CardTitle>Fit & Feasibility Assessment</CardTitle>
            </div>
            <CardDescription>
              Is this approach right for your context? Can you implement it well?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="approach">Chosen Approach</Label>
              <Input
                id="approach"
                placeholder="e.g., Evidence-based intervention framework"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence Base</Label>
              <Textarea
                id="evidence"
                placeholder="What research or evidence supports this approach?..."
                rows={3}
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
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success Metrics */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Success Metrics & Measurement Plan</CardTitle>
            </div>
            <CardDescription>
              How will you know if it's working? Define leading and lagging indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>
      )}

      {/* Explore Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Checklist</CardTitle>
          <CardDescription>
            Complete all required items before progressing to Plan stage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {exploreChecklist.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 rounded-lg border p-3">
                <Checkbox
                  id={item.id}
                  checked={checkedItems[item.id]}
                  onCheckedChange={(checked) =>
                    setCheckedItems({ ...checkedItems, [item.id]: checked as boolean })
                  }
                />
                <label
                  htmlFor={item.id}
                  className="flex-1 text-sm leading-relaxed cursor-pointer"
                >
                  {item.text}
                  {item.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </label>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Checklist completion</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous Step
        </Button>
        <div className="flex items-center gap-3">
          {step < 4 ? (
            <Button onClick={() => setStep(Math.min(4, step + 1))}>
              Next Step
            </Button>
          ) : (
            <Button disabled={completionRate < 100}>
              Generate Decision Brief
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
