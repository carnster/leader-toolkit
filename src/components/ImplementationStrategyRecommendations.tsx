import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface StrategyRecommendation {
  strategy_name: string;
  eric_category: string;
  description: string;
  target_barrier: string;
  resources_needed: string;
  responsible_party: string;
  timeline: string;
  success_indicators: string;
}

interface ImplementationStrategyRecommendationsProps {
  initiativeId: string;
  decisionBrief: any;
  activeIngredients: Array<{
    name: string;
    is_core: boolean;
  }>;
  onApplyRecommendation: (recommendation: StrategyRecommendation) => void;
}

const ericCategoryLabels: Record<string, string> = {
  evaluative_iterative: "Evaluative & Iterative",
  provide_interactive_assistance: "Provide Interactive Assistance",
  adapt_practice: "Adapt Practice",
  develop_stakeholder_relationships: "Develop Stakeholder Relationships",
  train_educate: "Train & Educate",
  support_clinicians: "Support Clinicians",
  engage_consumers: "Engage Consumers",
  use_financial_strategies: "Use Financial Strategies",
  change_infrastructure: "Change Infrastructure"
};

export function ImplementationStrategyRecommendations({
  initiativeId,
  decisionBrief,
  activeIngredients,
  onApplyRecommendation,
}: ImplementationStrategyRecommendationsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!decisionBrief) {
      toast({
        title: "Decision brief needed",
        description: "Please complete the Decide stage before generating strategy recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAppliedIndices(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("recommend-strategies", {
        body: {
          decisionBrief: {
            problem_statement: decisionBrief.problem_statement,
            target_group: decisionBrief.target_group,
            goals: decisionBrief.goals,
            chosen_approach: decisionBrief.chosen_approach,
          },
          activeIngredients: activeIngredients.map(ai => ({
            name: ai.name,
            is_core: ai.is_core,
          })),
        },
      });

      if (error) throw error;

      setRecommendations(data.strategies || []);
      toast({
        title: "Strategies generated",
        description: `Generated ${data.strategies?.length || 0} implementation strategy recommendations.`,
      });
    } catch (error: any) {
      console.error("Error generating strategy recommendations:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate strategy recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyOne = (recommendation: StrategyRecommendation, index: number) => {
    onApplyRecommendation(recommendation);
    setAppliedIndices(prev => new Set(prev).add(index));
  };

  const handleApplyAll = () => {
    const unapplied = recommendations.filter((_, idx) => !appliedIndices.has(idx));
    unapplied.forEach(rec => onApplyRecommendation(rec));
    setRecommendations([]);
    setAppliedIndices(new Set());
  };

  const handleDiscard = () => {
    setRecommendations([]);
    setAppliedIndices(new Set());
  };

  const unappliedCount = recommendations.filter((_, idx) => !appliedIndices.has(idx)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Strategy Recommendations
        </CardTitle>
        <CardDescription>
          Generate implementation strategies based on your problem statement, goals, and active ingredients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating recommendations...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Recommendations
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {recommendations.length} strategies generated • {appliedIndices.size} applied
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDiscard}>
                  Discard All
                </Button>
                {unappliedCount > 0 && (
                  <Button onClick={handleApplyAll}>
                    Apply {unappliedCount} Remaining
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.map((strategy, index) => {
                const isApplied = appliedIndices.has(index);
                return (
                  <Card key={index} className={isApplied ? "opacity-50" : ""}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {ericCategoryLabels[strategy.eric_category] || strategy.eric_category}
                            </Badge>
                            {isApplied && (
                              <Badge variant="secondary" className="gap-1">
                                <Check className="h-3 w-3" />
                                Applied
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{strategy.strategy_name}</h4>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                          {strategy.target_barrier && (
                            <p className="text-sm">
                              <span className="font-medium">Target Barrier:</span> {strategy.target_barrier}
                            </p>
                          )}
                          {strategy.resources_needed && (
                            <p className="text-sm">
                              <span className="font-medium">Resources:</span> {strategy.resources_needed}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm">
                            {strategy.responsible_party && (
                              <span>
                                <span className="font-medium">Owner:</span> {strategy.responsible_party}
                              </span>
                            )}
                            {strategy.timeline && (
                              <span>
                                <span className="font-medium">Timeline:</span> {strategy.timeline}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={isApplied ? "ghost" : "default"}
                          size="sm"
                          onClick={() => handleApplyOne(strategy, index)}
                          disabled={isApplied}
                        >
                          {isApplied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Applied
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Accept
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
