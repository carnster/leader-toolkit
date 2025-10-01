import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInitiativeTemplates, InitiativeTemplate } from "@/hooks/useInitiativeTemplates";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { BookOpen, Target, CheckCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface TemplateDetailProps {
  template: InitiativeTemplate;
  onSelect: (template: InitiativeTemplate) => void;
  isCreating: boolean;
}

function TemplateDetail({ template, onSelect, isCreating }: TemplateDetailProps) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{template.category}</Badge>
          <Badge variant="outline">{template.typical_timeline || "Variable timeline"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>

      {/* Evidence Base */}
      <div className="rounded-lg border p-4 bg-primary/5">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          Evidence Base
        </h4>
        <p className="text-sm text-muted-foreground">{template.evidence_base}</p>
      </div>

      {/* Target Outcomes */}
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Expected Outcomes
        </h4>
        <ul className="space-y-1">
          {template.target_outcomes.map((outcome, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Resources Needed */}
      {template.resources_needed && template.resources_needed.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Resources Needed</h4>
          <div className="flex flex-wrap gap-2">
            {template.resources_needed.map((resource, idx) => (
              <Badge key={idx} variant="secondary">
                {resource}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active Ingredients Preview */}
      <div>
        <h4 className="font-semibold mb-2">Active Ingredients ({template.active_ingredients.length})</h4>
        <div className="space-y-2">
          {template.active_ingredients.slice(0, 3).map((ingredient: any, idx: number) => (
            <div key={idx} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{ingredient.name}</span>
                <Badge variant={ingredient.is_core ? "default" : "secondary"} className="text-xs">
                  {ingredient.is_core ? "Core" : "Adaptable"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{ingredient.description}</p>
            </div>
          ))}
          {template.active_ingredients.length > 3 && (
            <p className="text-xs text-muted-foreground">
              + {template.active_ingredients.length - 3} more components
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={() => onSelect(template)}
        disabled={isCreating}
        className="w-full"
        size="lg"
      >
        {isCreating ? "Creating Initiative..." : "Use This Template"}
      </Button>
    </div>
  );
}

export function InitiativeTemplateSelector() {
  const { templates, isLoading, getAllCategories } = useInitiativeTemplates();
  const { createInitiative, isCreating } = useInitiatives();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InitiativeTemplate | null>(null);

  const categories = getAllCategories();

  const handleSelectTemplate = async (template: InitiativeTemplate) => {
    try {
      // Create the initiative
      createInitiative(
        {
          title: template.name,
          description: template.description,
          stage: "decide",
          status: "active",
        },
        {
          onSuccess: async (newInitiative: any) => {
            // The initiative is created, now we need to add the template data
            // This will be handled by the Decide page when it loads
            toast({
              title: "Initiative created from template!",
              description: "Redirecting to Decision Brief to complete setup...",
            });
            
            // Store template ID in session storage so Decide page can use it
            sessionStorage.setItem("templateId", template.id);
            sessionStorage.setItem("initiativeId", newInitiative.id);
            
            setOpen(false);
            navigate(`/decide?initiative=${newInitiative.id}`);
          },
        }
      );
    } catch (error) {
      console.error("Error creating initiative from template:", error);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Evidence-Based Initiatives
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Browse Evidence-Based Initiatives
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Evidence-Based Initiative Templates
          </DialogTitle>
          <DialogDescription>
            Choose from research-backed programs with proven effectiveness. Each template includes pre-configured active ingredients and implementation guidance.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={categories[0] || "all"} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => {
            const categoryTemplates = templates.filter(t => t.category === category);
            
            return (
              <TabsContent key={category} value={category} className="space-y-4 mt-4">
                {selectedTemplate && selectedTemplate.category === category ? (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                      className="mb-4"
                    >
                      ← Back to {category}
                    </Button>
                    <TemplateDetail
                      template={selectedTemplate}
                      onSelect={handleSelectTemplate}
                      isCreating={isCreating}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryTemplates.map(template => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3" />
                              <span>{template.active_ingredients.length} active ingredients</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {template.target_outcomes.slice(0, 2).map((outcome, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {outcome}
                                </Badge>
                              ))}
                              {template.target_outcomes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.target_outcomes.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
