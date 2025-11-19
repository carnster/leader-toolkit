import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Check, X, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBudgetItems } from "@/hooks/useBudgetItems";

interface BudgetRecommendation {
  category: string;
  description: string;
  estimated_cost: number;
  funding_source: string;
  notes: string;
}

interface BudgetRecommendationsProps {
  initiativeId: string;
  onClose: () => void;
}

export function BudgetRecommendations({ initiativeId, onClose }: BudgetRecommendationsProps) {
  const { toast } = useToast();
  const { createBudgetItem } = useBudgetItems(initiativeId);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isAccepting, setIsAccepting] = useState(false);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-budget", {
        body: { initiativeId },
      });

      if (error) {
        if (error.message.includes("Rate limit")) {
          toast({
            title: "Rate limit reached",
            description: "Please wait a moment before generating budget recommendations again.",
            variant: "destructive",
          });
        } else if (error.message.includes("credits")) {
          toast({
            title: "AI credits exhausted",
            description: "Please add credits to your workspace to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.budget_recommendations) {
        setRecommendations(data.budget_recommendations);
        // Select all by default
        setSelectedItems(new Set(data.budget_recommendations.map((_: any, i: number) => i)));
        toast({
          title: "Budget recommendations generated",
          description: `${data.budget_recommendations.length} budget items suggested based on your initiative context.`,
        });
      }
    } catch (error) {
      console.error("Error generating budget recommendations:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate budget recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const acceptSelected = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one budget item to accept.",
        variant: "destructive",
      });
      return;
    }

    setIsAccepting(true);
    try {
      const itemsToCreate = recommendations
        .filter((_, i) => selectedItems.has(i))
        .map((rec) => ({
          initiative_id: initiativeId,
          category: rec.category,
          description: rec.description,
          estimated_cost: rec.estimated_cost,
          funding_source: rec.funding_source,
          notes: rec.notes,
          actual_cost: null,
        }));

      // Insert all items
      const { error } = await supabase
        .from("budget_items")
        .insert(itemsToCreate);

      if (error) throw error;

      toast({
        title: "Budget items added",
        description: `${selectedItems.size} budget items have been added to your plan.`,
      });

      onClose();
    } catch (error) {
      console.error("Error accepting budget recommendations:", error);
      toast({
        title: "Failed to add items",
        description: "Could not add budget items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Budget Recommendations</CardTitle>
          </div>
          <CardDescription>
            Generate budget recommendations based on your initiative's context, strategies, and team size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              The AI will analyze your initiative and suggest budget categories with realistic cost estimates
              based on typical education sector pricing.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={generateRecommendations} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Budget Recommendations
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSelected = recommendations
    .filter((_, i) => selectedItems.has(i))
    .reduce((sum, rec) => sum + rec.estimated_cost, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Budget Recommendations</CardTitle>
              <CardDescription>
                Review and select budget items to add to your plan
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="font-medium">Total Selected Budget</span>
          <Badge variant="default" className="font-mono text-base">
            ${totalSelected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Badge>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedItems.has(index)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30"
              }`}
              onClick={() => toggleSelection(index)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {selectedItems.has(index) ? (
                    <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold">{rec.category}</h4>
                    <Badge variant="outline" className="font-mono shrink-0">
                      ${rec.estimated_cost.toLocaleString("en-US")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Funding:</span> {rec.funding_source}
                    </span>
                  </div>
                  {rec.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 {rec.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={acceptSelected} disabled={isAccepting || selectedItems.size === 0}>
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Items...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept Selected ({selectedItems.size})
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRecommendations([]);
              setSelectedItems(new Set());
            }}
          >
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
