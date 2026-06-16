import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Plus, Edit, Trash, Loader2, BookOpen, Network, CalendarRange, UserCheck, UserX } from "lucide-react";
import { AddActiveIngredientDialog } from "@/components/AddActiveIngredientDialog";
import { ERICStrategySelector } from "@/components/ERICStrategySelector";
import { ImplementationStrategyRecommendations } from "@/components/ImplementationStrategyRecommendations";
import { StrategyIngredientConnections } from "@/components/StrategyIngredientConnections";
import { StrategyTimeline } from "@/components/plan/StrategyTimeline";
import { AdaptationProtocolSummary } from "@/components/AdaptationProtocolSummary";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import type { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { ERIC_CLUSTERS, ericLabel } from "@/lib/ericClusters";

interface StrategicFoundationSectionProps {
  activeIngredients: ActiveIngredient[];
  strategies: ImplementationStrategy[];
  initiativeId: string;
  isLoadingIngredients: boolean;
  isLoadingStrategies: boolean;
  isGeneratingIngredients: boolean;
  isGeneratingStrategies: boolean;
  onGenerateIngredients: () => void;
  onGenerateStrategies: () => void;
  onEditIngredient: (ingredient: ActiveIngredient) => void;
  onEditStrategy: (strategy: ImplementationStrategy) => void;
  onDeleteStrategy: (id: string) => void;
  onAddStrategy: () => void;
}

export function StrategicFoundationSection({
  activeIngredients,
  strategies,
  initiativeId,
  isLoadingIngredients,
  isLoadingStrategies,
  isGeneratingIngredients,
  isGeneratingStrategies,
  onGenerateIngredients,
  onGenerateStrategies,
  onEditIngredient,
  onEditStrategy,
  onDeleteStrategy,
  onAddStrategy,
}: StrategicFoundationSectionProps) {
  const [showERICLibrary, setShowERICLibrary] = useState(false);
  const { decisionBrief } = useDecisionBrief(initiativeId);
  const { createStrategy } = useImplementationStrategies(initiativeId);
  const { toast } = useToast();

  const handleApplyStrategyRecommendation = async (recommendation: any) => {
    try {
      await createStrategy({
        strategy_name: recommendation.strategy_name,
        eric_category: recommendation.eric_category,
        implementation_phase: recommendation.implementation_phase ?? null,
        description: recommendation.description,
        target_barrier: recommendation.target_barrier,
        timeline: recommendation.timeline,
        resources_needed: recommendation.resources_needed,
        success_indicators: recommendation.success_indicators,
        responsible_party: recommendation.responsible_party,
        status: "planned",
      });
    } catch (error) {
      console.error("Error creating strategy:", error);
      toast({
        title: "Error creating strategy",
        description: error instanceof Error ? error.message : "Failed to create strategy.",
        variant: "destructive",
      });
    }
  };

  const coreIngredients = activeIngredients.filter((ing) => ing.is_core);
  const adaptableIngredients = activeIngredients.filter((ing) => !ing.is_core);

  const strategiesByCategory = Object.fromEntries(
    ERIC_CLUSTERS.map((cluster) => [
      cluster.value,
      strategies.filter((s) => s.eric_category === cluster.value),
    ])
  );

  return (
    <div className="space-y-6">
      {/* Active Ingredients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Active Ingredients Mapper</CardTitle>
            </div>
            <div className="flex gap-2">
              {activeIngredients.length === 0 && (
                <Button
                  onClick={onGenerateIngredients}
                  disabled={isGeneratingIngredients}
                  variant="outline"
                >
                  {isGeneratingIngredients ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate from Approach
                    </>
                  )}
                </Button>
              )}
              <AddActiveIngredientDialog initiativeId={initiativeId} />
            </div>
          </div>
          <CardDescription>
            Define core practices (non-negotiable) and adaptable elements with clear look-fors for fidelity monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingIngredients ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading active ingredients...</p>
          ) : activeIngredients.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No active ingredients yet.</p>
              <p className="text-xs text-muted-foreground">
                Click "Generate from Approach" to auto-populate based on your chosen intervention, or add manually.
              </p>
            </div>
          ) : (
            <>
              {coreIngredients.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="destructive">CORE</Badge>
                    Non-Negotiable Components
                  </h4>
                  {coreIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{ingredient.name}</h5>
                          {ingredient.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditIngredient(ingredient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Look-fors:</span>
                          <ul className="list-disc list-inside text-muted-foreground mt-1">
                            {ingredient.look_fors.slice(0, 3).map((lookFor, idx) => (
                              <li key={idx}>{lookFor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {adaptableIngredients.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="secondary">ADAPTABLE</Badge>
                    Flexible Components
                  </h4>
                  {adaptableIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{ingredient.name}</h5>
                          {ingredient.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ingredient.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditIngredient(ingredient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Adaptation Protocol Summary */}
      <AdaptationProtocolSummary activeIngredients={activeIngredients} initiativeId={initiativeId} />

      {/* Implementation Strategies - AI Recommendations */}
      <ImplementationStrategyRecommendations
        initiativeId={initiativeId}
        decisionBrief={decisionBrief}
        activeIngredients={activeIngredients}
        onApplyRecommendation={handleApplyStrategyRecommendation}
      />

      {/* Implementation Strategies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Implementation Strategies (ERIC Framework)</CardTitle>
            </div>
            <Button onClick={onAddStrategy} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Strategy
            </Button>
          </div>
          <CardDescription>
            Select implementation strategies that address your feasibility barriers using the ERIC framework.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="list">Strategy List</TabsTrigger>
              <TabsTrigger value="connections">
                <Network className="h-4 w-4 mr-2" />
                Visual Connections
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <CalendarRange className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-0">
              {/* ERIC Library Toggle */}
              <Collapsible open={showERICLibrary} onOpenChange={setShowERICLibrary}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full mb-4">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {showERICLibrary ? "Hide" : "Show"} ERIC Strategy Reference Library
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mb-6">
                    <ERICStrategySelector />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {isLoadingStrategies ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading strategies...</p>
              ) : strategies.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">No implementation strategies yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Generate AI recommendations based on your feasibility assessment or browse the ERIC library.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(strategiesByCategory).map(([category, categoryStrategies]) => {
                    if (categoryStrategies.length === 0) return null;
                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Badge variant="outline">{ericLabel(category)}</Badge>
                          {categoryStrategies.length} {categoryStrategies.length === 1 ? "Strategy" : "Strategies"}
                        </h4>
                        <div className="space-y-3">
                          {categoryStrategies.map((strategy) => (
                            <div key={strategy.id} className="rounded-lg border p-4 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{strategy.strategy_name}</h4>
                                    <Badge
                                      variant={
                                        strategy.status === "completed"
                                          ? "default"
                                          : strategy.status === "in_progress"
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {strategy.status.replace("_", " ")}
                                    </Badge>
                                    {strategy.responsible_party_id ? (
                                      <Badge variant="outline" className="text-xs">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Assigned
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        <UserX className="h-3 w-3 mr-1" />
                                        Unassigned
                                      </Badge>
                                    )}
                                  </div>
                                  {strategy.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button variant="ghost" size="sm" onClick={() => onEditStrategy(strategy)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Delete this strategy?")) {
                                        onDeleteStrategy(strategy.id);
                                      }
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
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
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <StrategyTimeline strategies={strategies} />
            </TabsContent>

            <TabsContent value="connections" className="mt-0">
              <StrategyIngredientConnections
                activeIngredients={activeIngredients}
                strategies={strategies}
                onEditStrategy={onEditStrategy}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
