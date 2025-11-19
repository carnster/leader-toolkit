import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookTemplate, Eye, Users, Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { ChecklistItem, RatingScale } from "@/hooks/useFidelityChecklists";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  items: Omit<ChecklistItem, "id">[];
  ratingScale: RatingScale;
}

const templates: Template[] = [
  {
    id: "classroom-observation",
    name: "Classroom Observation",
    description: "Comprehensive classroom observation checklist for instructional fidelity",
    icon: Eye,
    category: "Instruction",
    items: [
      { indicator: "Learning objectives clearly stated", description: "Teacher communicates clear learning goals at start of lesson" },
      { indicator: "Active student engagement", description: "Students actively participating in learning activities" },
      { indicator: "Differentiated instruction", description: "Instruction adapted to meet diverse student needs" },
      { indicator: "Formative assessment used", description: "Teacher checks for understanding throughout lesson" },
      { indicator: "Positive classroom climate", description: "Respectful, supportive environment maintained" },
      { indicator: "Time used effectively", description: "Instructional time maximized, transitions smooth" },
      { indicator: "Materials and resources prepared", description: "All necessary materials ready and accessible" },
    ],
    ratingScale: {
      min: 1,
      max: 5,
      labels: ["Not Observed", "Minimal", "Developing", "Proficient", "Exemplary"]
    }
  },
  {
    id: "coaching-session",
    name: "Coaching Session",
    description: "Checklist for coaching fidelity with teachers or implementers",
    icon: Users,
    category: "Professional Development",
    items: [
      { indicator: "Pre-conference objectives set", description: "Clear goals established before observation" },
      { indicator: "Evidence-based feedback provided", description: "Feedback grounded in observation data" },
      { indicator: "Reflective dialogue facilitated", description: "Coach supports teacher reflection on practice" },
      { indicator: "Specific action steps identified", description: "Clear next steps co-created with teacher" },
      { indicator: "Resources and support offered", description: "Coach provides tools or materials as needed" },
      { indicator: "Follow-up plan established", description: "Timeline for next coaching cycle determined" },
    ],
    ratingScale: {
      min: 1,
      max: 4,
      labels: ["Not Present", "Partially Present", "Mostly Present", "Fully Present"]
    }
  },
  {
    id: "planning-meeting",
    name: "Planning Meeting",
    description: "Collaborative planning session fidelity checklist",
    icon: Calendar,
    category: "Collaboration",
    items: [
      { indicator: "Agenda shared in advance", description: "Meeting agenda provided to all participants beforehand" },
      { indicator: "All members present and engaged", description: "Full team attendance and active participation" },
      { indicator: "Student data reviewed", description: "Team examines relevant student performance data" },
      { indicator: "Evidence-based strategies discussed", description: "Team considers research-based approaches" },
      { indicator: "Action items assigned", description: "Clear responsibilities and deadlines established" },
      { indicator: "Next steps documented", description: "Decisions and follow-up tasks recorded" },
    ],
    ratingScale: {
      min: 1,
      max: 4,
      labels: ["No", "Partially", "Mostly", "Yes"]
    }
  },
  {
    id: "intervention-delivery",
    name: "Intervention Delivery",
    description: "Checklist for monitoring intervention implementation fidelity",
    icon: CheckCircle2,
    category: "Intervention",
    items: [
      { indicator: "Intervention delivered as designed", description: "All core components implemented according to protocol" },
      { indicator: "Appropriate dosage provided", description: "Correct duration and frequency maintained" },
      { indicator: "Student engagement high", description: "Students actively participating in intervention" },
      { indicator: "Progress monitoring conducted", description: "Student response to intervention tracked" },
      { indicator: "Adaptations documented", description: "Any modifications recorded with justification" },
      { indicator: "Materials used correctly", description: "Intervention materials utilized as intended" },
    ],
    ratingScale: {
      min: 1,
      max: 5,
      labels: ["Not Observed", "Emerging", "Developing", "Proficient", "Exemplary"]
    }
  },
];

interface FidelityChecklistTemplatesProps {
  activeIngredients: ActiveIngredient[];
  onApplyTemplate: (template: Omit<any, "id" | "created_at" | "updated_at">) => void;
  initiativeId: string;
}

export function FidelityChecklistTemplates({ 
  activeIngredients, 
  onApplyTemplate,
  initiativeId 
}: FidelityChecklistTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !selectedIngredient) return;

    const checklistItems: ChecklistItem[] = selectedTemplate.items.map((item, index) => ({
      id: crypto.randomUUID(),
      indicator: item.indicator,
      description: item.description,
    }));

    const newChecklist = {
      initiative_id: initiativeId,
      active_ingredient_id: selectedIngredient,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      checklist_items: checklistItems,
      rating_scale: selectedTemplate.ratingScale,
    };

    onApplyTemplate(newChecklist);
    setDialogOpen(false);
    setSelectedTemplate(null);
    setSelectedIngredient("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookTemplate className="h-5 w-5 text-primary" />
          Fidelity Checklist Templates
        </CardTitle>
        <CardDescription>
          Start with proven checklist templates and customize them for your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:border-primary transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      <strong>{template.items.length}</strong> observation indicators
                    </div>
                    
                    <Dialog open={dialogOpen && selectedTemplate?.id === template.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) {
                        setSelectedTemplate(null);
                        setSelectedIngredient("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setDialogOpen(true);
                          }}
                        >
                          Use Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            {template.name}
                          </DialogTitle>
                          <DialogDescription>
                            Review the template and select which active ingredient to monitor
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Select Active Ingredient */}
                          <div className="space-y-2">
                            <Label htmlFor="ingredient-select">
                              Active Ingredient to Monitor <span className="text-destructive">*</span>
                            </Label>
                            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                              <SelectTrigger id="ingredient-select">
                                <SelectValue placeholder="Select an active ingredient..." />
                              </SelectTrigger>
                              <SelectContent>
                                {activeIngredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id}>
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Preview Items */}
                          <div className="space-y-2">
                            <Label>Observation Indicators ({template.items.length})</Label>
                            <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                              {template.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  <p className="font-medium">{item.indicator}</p>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rating Scale Preview */}
                          <div className="space-y-2">
                            <Label>Rating Scale</Label>
                            <div className="flex gap-1">
                              {template.ratingScale.labels.map((label, index) => (
                                <div 
                                  key={index}
                                  className="flex-1 text-center p-2 border rounded text-xs"
                                >
                                  <div className="font-bold">{index + 1}</div>
                                  <div className="text-muted-foreground">{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              onClick={handleApplyTemplate}
                              disabled={!selectedIngredient}
                              className="flex-1"
                            >
                              Create Checklist
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDialogOpen(false);
                                setSelectedTemplate(null);
                                setSelectedIngredient("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
