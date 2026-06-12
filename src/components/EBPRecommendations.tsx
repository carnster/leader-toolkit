import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DecisionBrief } from "@/hooks/useDecisionBrief";
import { useInitiativeTemplates } from "@/hooks/useInitiativeTemplates";

interface ActiveIngredient {
  name: string;
  description: string;
  is_core: boolean;
  category?: string;
  look_fors?: string[];
  adaptable_boundaries?: string[];
}

interface EBPRecommendation {
  name: string;
  template_id?: string | null;
  description: string;
  evidence_level: 'Strong' | 'Moderate' | 'Emerging';
  fit_score: number;
  implementation_notes: string;
  active_ingredients?: ActiveIngredient[];
  equity_checklist?: Record<string, string>;
}

interface EBPRecommendationsProps {
  decisionBrief: DecisionBrief | null;
  onSelectRecommendation?: (recommendation: EBPRecommendation) => void;
  /** Adopt a matched in-app template as the solution (Decide Step 4). */
  onAdoptTemplate?: (templateId: string) => void;
}

export function EBPRecommendations({ decisionBrief, onSelectRecommendation, onAdoptTemplate }: EBPRecommendationsProps) {
  const { templates } = useInitiativeTemplates();
  const [recommendations, setRecommendations] = useState<EBPRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const getRecommendations = async () => {
    if (!decisionBrief) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in to use AI features.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-ebp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            decisionBrief,
            availableTemplates: (templates || []).map(t => ({
              id: t.id, name: t.name, category: t.category, description: t.description,
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'Strong': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Moderate': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'Emerging': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Recommended Evidence-Based Practices
              <Badge variant="secondary" className="ml-2">Optional</Badge>
            </CardTitle>
            <CardDescription>
              Get personalized EBP recommendations based on your decision brief, or skip if you already have an initiative in mind
            </CardDescription>
          </div>
          {recommendations.length === 0 && (
            <Button onClick={getRecommendations} disabled={isLoading || !decisionBrief} variant="outline">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          )}
        </div>
        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            💡 Already have an initiative from templates or your own approach? Feel free to continue without recommendations.
          </p>
        )}
      </CardHeader>
      {recommendations.length > 0 && (
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              className={`transition-all ${
                selectedId === `${index}` ? 'border-primary shadow-md' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rec.name}</CardTitle>
                      {selectedId === `${index}` && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getEvidenceColor(rec.evidence_level)} variant="secondary">
                        {rec.evidence_level} Evidence
                      </Badge>
                      <Badge variant="outline" className={getFitScoreColor(rec.fit_score)}>
                        {rec.fit_score}% Fit
                      </Badge>
                      {rec.template_id && (
                        <Badge className="bg-accent/10 text-accent" variant="secondary">
                          Full template in this app
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={selectedId === `${index}` ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedId(`${index}`);
                      onSelectRecommendation?.(rec);
                      
                      // Store active ingredients for Plan stage
                      if (rec.active_ingredients) {
                        sessionStorage.setItem('aiRecommendationIngredients', JSON.stringify(rec.active_ingredients));
                      }
                      
                      toast({
                        title: "Recommendation Selected",
                        description: `${rec.name} has been noted. Active ingredients will be loaded in the Plan & Prepare stage.`,
                      });
                    }}
                  >
                    {selectedId === `${index}` ? "Selected" : "Select"}
                  </Button>
                </div>
                {rec.template_id && onAdoptTemplate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => onAdoptTemplate(rec.template_id!)}
                  >
                    Adopt Template as Solution
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Implementation Considerations:</p>
                  <p className="text-sm text-muted-foreground">{rec.implementation_notes}</p>
                </div>
                {rec.active_ingredients && rec.active_ingredients.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Active Ingredients ({rec.active_ingredients.length}):</p>
                    <div className="space-y-1">
                      {rec.active_ingredients.map((ing, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant={ing.is_core ? "default" : "secondary"} className="text-xs">
                            {ing.is_core ? "Core" : "Adaptable"}
                          </Badge>
                          <span>{ing.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={getRecommendations}
            disabled={isLoading}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Get New Recommendations
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
