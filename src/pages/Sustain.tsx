import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Calendar, BookOpen, Scale, CheckCircle2, TrendingUp, BarChart3, Plus, Pencil, Trash2 } from "lucide-react";
import { MasterChecklist } from "@/components/MasterChecklist";
import { useSearchParams } from "react-router-dom";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useIndicators } from "@/hooks/useIndicators";
import {
  useSustainabilityPlan,
  EmbeddingRoutine,
  OnboardingResource,
  OnboardingStatus,
  ProtectionCategory,
  ResourceProtection,
  ResourceProtectionsData,
  ScaleReadinessRating,
} from "@/hooks/useSustainabilityPlan";

const SUSTAIN_CHECKLIST = [
  { id: "leadership_support", text: "Leaders continue to acknowledge and support good implementation practices" },
  { id: "staff_range", text: "Range of staff involved so we aren't over-relying on individuals" },
  { id: "review_outcomes", text: "Reviewed implementation effort and outcomes before deciding next steps" },
  { id: "embedded_sops", text: "Core practices embedded in standard operating procedures" },
];

const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  complete: "Complete",
};

const PROTECTION_CATEGORIES: { value: ProtectionCategory; label: string }[] = [
  { value: "time", label: "Time Allocations" },
  { value: "budget", label: "Budget & Materials" },
  { value: "staffing", label: "Staffing & Expertise" },
];

const SCALE_DIMENSIONS = [
  { id: "evidence", title: "Evidence of Impact", question: "Do you have clear outcome data?" },
  { id: "fidelity", title: "Fidelity & Sustainability", question: "Are practices embedded?" },
  { id: "leadership", title: "Leadership & Resources", question: "Can you support expansion?" },
];

const READINESS_LABELS: Record<ScaleReadinessRating, string> = {
  not_yet: "Not yet",
  moderate: "Moderate",
  strong: "Strong",
};

const READINESS_SCORES: Record<ScaleReadinessRating, number> = {
  not_yet: 0,
  moderate: 50,
  strong: 100,
};

const NEXT_STEP_OPTIONS = [
  { value: "continue_refine", title: "Continue & Refine", description: "Keep going with minor adjustments" },
  { value: "scale_up", title: "Scale Up", description: "Expand to more grade levels or schools" },
  { value: "stop_pivot", title: "Stop or Pivot", description: "Data suggests a different approach" },
];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Sustain() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";

  const { activeIngredients } = useActiveIngredients(effectiveInitiativeId);
  const { strategies } = useImplementationStrategies(effectiveInitiativeId);
  const { indicators } = useIndicators(effectiveInitiativeId);
  const { sustainabilityPlan, isLoading, upsertPlan, isSaving } = useSustainabilityPlan(
    effectiveInitiativeId || undefined
  );

  const successfulStrategies = strategies.filter(s => s.status === 'completed');
  const coreIngredients = activeIngredients.filter((ing: any) => ing.is_core ?? ing.isCore);

  const hasInitiative = !!effectiveInitiativeId;
  const routines = sustainabilityPlan?.embedding_routines ?? [];
  const onboardingResources = sustainabilityPlan?.onboarding_resources ?? [];
  const protections = sustainabilityPlan?.resource_protections?.protections ?? [];
  const checklist = sustainabilityPlan?.resource_protections?.checklist ?? {};
  const scaleReadiness = sustainabilityPlan?.resource_protections?.scaleReadiness ?? {};
  const nextSteps = sustainabilityPlan?.next_steps ?? null;

  // --- Inline form state ---
  const emptyRoutineForm = { name: "", schedule: "", owner: "" };
  const [routineForm, setRoutineForm] = useState<typeof emptyRoutineForm | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  const emptyResourceForm = { name: "", status: "planned" as OnboardingStatus };
  const [resourceForm, setResourceForm] = useState<typeof emptyResourceForm | null>(null);

  const emptyProtectionForm = { category: "time" as ProtectionCategory, text: "" };
  const [protectionForm, setProtectionForm] = useState<typeof emptyProtectionForm | null>(null);

  // --- Save helpers ---
  const saveProtectionsData = (patch: Partial<ResourceProtectionsData>, silent = false, extra: Record<string, any> = {}) => {
    upsertPlan({
      resource_protections: { protections, checklist, scaleReadiness, ...patch },
      _silent: silent,
      ...extra,
    });
  };

  const toggleChecklistItem = (id: string, checked: boolean) => {
    saveProtectionsData({ checklist: { ...checklist, [id]: checked } }, true);
  };

  const saveRoutine = () => {
    if (!routineForm || !routineForm.name.trim()) return;
    const entry: EmbeddingRoutine = {
      id: editingRoutineId ?? newId(),
      name: routineForm.name.trim(),
      schedule: routineForm.schedule.trim(),
      owner: routineForm.owner.trim(),
    };
    const next = editingRoutineId
      ? routines.map(r => (r.id === editingRoutineId ? entry : r))
      : [...routines, entry];
    upsertPlan({ embedding_routines: next });
    setRoutineForm(null);
    setEditingRoutineId(null);
  };

  const deleteRoutine = (id: string) => {
    upsertPlan({ embedding_routines: routines.filter(r => r.id !== id) });
    if (editingRoutineId === id) {
      setRoutineForm(null);
      setEditingRoutineId(null);
    }
  };

  const saveResource = () => {
    if (!resourceForm || !resourceForm.name.trim()) return;
    const entry: OnboardingResource = {
      id: newId(),
      name: resourceForm.name.trim(),
      status: resourceForm.status,
    };
    upsertPlan({ onboarding_resources: [...onboardingResources, entry] });
    setResourceForm(null);
  };

  const updateResourceStatus = (id: string, status: OnboardingStatus) => {
    upsertPlan({
      onboarding_resources: onboardingResources.map(r => (r.id === id ? { ...r, status } : r)),
      _silent: true,
    });
  };

  const deleteResource = (id: string) => {
    upsertPlan({ onboarding_resources: onboardingResources.filter(r => r.id !== id) });
  };

  const saveProtection = () => {
    if (!protectionForm || !protectionForm.text.trim()) return;
    const entry: ResourceProtection = {
      id: newId(),
      category: protectionForm.category,
      text: protectionForm.text.trim(),
    };
    saveProtectionsData({ protections: [...protections, entry] });
    setProtectionForm(null);
  };

  const deleteProtection = (id: string) => {
    saveProtectionsData({ protections: protections.filter(p => p.id !== id) });
  };

  const setReadinessRating = (dimensionId: string, rating: ScaleReadinessRating) => {
    const nextRatings = { ...scaleReadiness, [dimensionId]: rating };
    const rated = SCALE_DIMENSIONS.map(d => nextRatings[d.id]).filter(Boolean) as ScaleReadinessRating[];
    const score = rated.length > 0
      ? Math.round(rated.reduce((sum, r) => sum + READINESS_SCORES[r], 0) / rated.length)
      : null;
    saveProtectionsData({ scaleReadiness: nextRatings }, true, { scale_readiness_score: score });
  };

  const chooseNextStep = (value: string) => {
    upsertPlan({ next_steps: value });
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Shield className="h-4 w-4" />
          <span>Stage 4 of 4: Spread & Sustain</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Spread & Sustain Stage</h1>
        <p className="text-muted-foreground mt-2">
          Navigate to sustainment, embed practices into standard operations, and prepare for spread
        </p>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              What to do in the Spread & Sustain Stage
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Navigate to sustainment:</strong> Transition from learning the work to doing the work</li>
              <li>• <strong>Embed in routines:</strong> Make practices part of standard operating procedures</li>
              <li>• <strong>Protect resources:</strong> Secure time, budget, and staffing allocations</li>
              <li>• <strong>Build onboarding systems:</strong> Prepare materials for new staff joining the initiative</li>
              <li>• <strong>Assess scale readiness:</strong> Determine if you're ready to expand to other settings</li>
              <li>• <strong>Celebrate success:</strong> Recognize and reward implementation achievements</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {!hasInitiative && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Select an initiative to build and save your sustainability plan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Implementation Summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>Implementation Journey Summary</CardTitle>
          <CardDescription>
            What you've built through the Decide, Plan & Prepare, and Implement stages, including continuous monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-background/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Core Ingredients</h4>
              </div>
              <p className="text-2xl font-bold mb-1">{coreIngredients.length}</p>
              <p className="text-xs text-muted-foreground">Non-negotiable components defined</p>
            </div>

            <div className="rounded-lg border bg-background/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold">Successful Strategies</h4>
              </div>
              <p className="text-2xl font-bold mb-1">{successfulStrategies.length}</p>
              <p className="text-xs text-muted-foreground">ERIC strategies completed</p>
            </div>

            <div className="rounded-lg border bg-background/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <h4 className="font-semibold">Indicators Tracked</h4>
              </div>
              <p className="text-2xl font-bold mb-1">{indicators.length}</p>
              <p className="text-xs text-muted-foreground">Leading & lagging measures</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sustainability Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Checklist</CardTitle>
          <CardDescription>
            Ensure the initiative is embedded for the long term
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SUSTAIN_CHECKLIST.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 rounded-lg border p-3">
              <Checkbox
                id={`sustain-check-${item.id}`}
                checked={!!checklist[item.id]}
                disabled={!hasInitiative || isLoading}
                onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor={`sustain-check-${item.id}`}
                className="flex-1 text-sm leading-relaxed cursor-pointer"
              >
                {item.text}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Embedding Routines */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Embedding Routines</CardTitle>
              <CardDescription>
                Regular practices that maintain implementation quality
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {routines.length === 0 && !routineForm && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No routines yet. Add the regular practices that will keep this work going, for example
              a weekly planning meeting owned by a grade-level team lead.
            </div>
          )}
          <div className="space-y-3">
            {routines.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {item.schedule && <span>{item.schedule}</span>}
                    {item.schedule && item.owner && <span>•</span>}
                    {item.owner && <span>Owner: {item.owner}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRoutineId(item.id);
                      setRoutineForm({ name: item.name, schedule: item.schedule, owner: item.owner });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit routine</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteRoutine(item.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete routine</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {routineForm && (
            <div className="mt-4 rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="routine-name">Routine</Label>
                  <Input
                    id="routine-name"
                    placeholder="e.g. Weekly planning meeting"
                    value={routineForm.name}
                    onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="routine-schedule">Schedule</Label>
                  <Input
                    id="routine-schedule"
                    placeholder="e.g. Mondays after dismissal"
                    value={routineForm.schedule}
                    onChange={(e) => setRoutineForm({ ...routineForm, schedule: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="routine-owner">Owner</Label>
                  <Input
                    id="routine-owner"
                    placeholder="e.g. Grade-level team lead"
                    value={routineForm.owner}
                    onChange={(e) => setRoutineForm({ ...routineForm, owner: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveRoutine} disabled={!routineForm.name.trim() || isSaving}>
                  {editingRoutineId ? "Save Changes" : "Add Routine"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRoutineForm(null);
                    setEditingRoutineId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!routineForm && (
            <Button
              variant="outline"
              className="w-full mt-4"
              disabled={!hasInitiative}
              onClick={() => {
                setEditingRoutineId(null);
                setRoutineForm(emptyRoutineForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Routine
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Onboarding Resources</CardTitle>
              <CardDescription>
                Help new staff understand and implement core practices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {onboardingResources.length === 0 && !resourceForm && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No onboarding resources yet. Add the materials new staff will need, for example
              an induction packet or a core practices walkthrough.
            </div>
          )}
          <div className="space-y-3">
            {onboardingResources.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Select
                    value={item.status}
                    onValueChange={(value) => updateResourceStatus(item.id, value as OnboardingStatus)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ONBOARDING_STATUS_LABELS) as OnboardingStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ONBOARDING_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => deleteResource(item.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete resource</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {resourceForm && (
            <div className="mt-4 rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="space-y-1.5">
                  <Label htmlFor="resource-name">Resource</Label>
                  <Input
                    id="resource-name"
                    placeholder="e.g. New staff induction packet"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={resourceForm.status}
                    onValueChange={(value) => setResourceForm({ ...resourceForm, status: value as OnboardingStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ONBOARDING_STATUS_LABELS) as OnboardingStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ONBOARDING_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveResource} disabled={!resourceForm.name.trim() || isSaving}>
                  Add Resource
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResourceForm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!resourceForm && (
            <Button
              variant="outline"
              className="w-full mt-4"
              disabled={!hasInitiative}
              onClick={() => setResourceForm(emptyResourceForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Core Practices to Embed */}
      {coreIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Core Practices to Embed in Standard Operations</CardTitle>
            <CardDescription>
              These active ingredients from your plan should become routine practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coreIngredients.map((ingredient: any) => (
                <div key={ingredient.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{ingredient.name}</p>
                      {ingredient.description && (
                        <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRoutineId(null);
                      setRoutineForm({ name: ingredient.name, schedule: "", owner: "" });
                    }}
                  >
                    Embed as Routine
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Protections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Resource Protections</CardTitle>
              <CardDescription>
                Safeguards to maintain time, budget, and staffing for your core components
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {protections.length === 0 && !protectionForm && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No protections recorded yet. Capture the specific commitments that safeguard this work:
              for example, protected meeting time, a dedicated budget line, or a formalized lead role.
            </div>
          )}

          {PROTECTION_CATEGORIES.map(({ value, label }) => {
            const items = protections.filter(p => p.category === value);
            if (items.length === 0) return null;
            return (
              <div key={value} className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium">{label}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>• {item.text}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={() => deleteProtection(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete protection</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {protectionForm && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={protectionForm.category}
                    onValueChange={(value) =>
                      setProtectionForm({ ...protectionForm, category: value as ProtectionCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTECTION_CATEGORIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="protection-text">Protection</Label>
                  <Input
                    id="protection-text"
                    placeholder="e.g. Weekly team meeting time protected in the master schedule"
                    value={protectionForm.text}
                    onChange={(e) => setProtectionForm({ ...protectionForm, text: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProtection} disabled={!protectionForm.text.trim() || isSaving}>
                  Add Protection
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setProtectionForm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!protectionForm && (
            <Button
              variant="outline"
              className="w-full"
              disabled={!hasInitiative}
              onClick={() => setProtectionForm(emptyProtectionForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Protection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Scale Readiness */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Scale Readiness Scan</CardTitle>
              <CardDescription>
                Assess if you're ready to expand to other grade levels or schools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SCALE_DIMENSIONS.map((dimension) => (
              <div key={dimension.id} className="flex items-center justify-between rounded-lg border p-4 gap-3">
                <div>
                  <p className="font-medium">{dimension.title}</p>
                  <p className="text-sm text-muted-foreground">{dimension.question}</p>
                </div>
                <Select
                  value={scaleReadiness[dimension.id] ?? ""}
                  onValueChange={(value) => setReadinessRating(dimension.id, value as ScaleReadinessRating)}
                  disabled={!hasInitiative}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Not assessed" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(READINESS_LABELS) as ScaleReadinessRating[]).map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {READINESS_LABELS[rating]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {sustainabilityPlan?.scale_readiness_score != null && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <p className="font-medium">Overall readiness</p>
                <Badge variant={sustainabilityPlan.scale_readiness_score >= 67 ? "default" : "secondary"}>
                  {sustainabilityPlan.scale_readiness_score}%
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Decision Point */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Decision Point: Next Steps</CardTitle>
          <CardDescription>
            Based on your implementation review and outcomes, what's next?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {NEXT_STEP_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                disabled={!hasInitiative}
                className={`h-auto flex-col items-start p-4 ${
                  nextSteps === option.value ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => chooseNextStep(option.value)}
              >
                <span className="font-semibold mb-1 flex items-center gap-2">
                  {option.title}
                  {nextSteps === option.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </span>
                <span className="text-sm text-muted-foreground whitespace-normal text-left">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Master Checklist */}
      <MasterChecklist stage="sustain" initiativeId={effectiveInitiativeId} />
    </div>
  );
}
