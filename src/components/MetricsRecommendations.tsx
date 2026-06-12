import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, TrendingUp, Activity, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DecisionBrief } from "@/hooks/useDecisionBrief";

interface MetricItem {
  indicator?: string;
  activity?: string;
  frequency: string;
  rationale: string;
}

interface MetricsRecommendation {
  leading_indicators: MetricItem[];
  lagging_indicators: MetricItem[];
  data_collection_activities: MetricItem[];
}

interface MetricsRecommendationsProps {
  decisionBrief: DecisionBrief | null;
  onApplyRecommendations?: (recommendations: MetricsRecommendation) => void;
}

export function MetricsRecommendations({ decisionBrief, onApplyRecommendations }: MetricsRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<MetricsRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const { toast } = useToast();

  const getRecommendations = async () => {
    if (!decisionBrief) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in to use AI features.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-metrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ decisionBrief }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error getting metrics recommendations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (recommendations && onApplyRecommendations) {
      onApplyRecommendations(recommendations);
      setApplied(true);
      toast({
        title: "Recommendations applied",
        description: "Metrics and measurement plan populated with AI suggestions",
      });
    }
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Recommended Metrics & Measurement Plan
              <Badge variant="secondary" className="ml-2">Optional</Badge>
            </CardTitle>
            <CardDescription>
              Get personalized measurement recommendations based on your decision brief
            </CardDescription>
          </div>
          {!recommendations && (
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
      </CardHeader>

      {recommendations && (
        <CardContent className="space-y-6">
          {/* Leading Indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Leading Indicators (Early Signals)</h3>
            </div>
            <div className="space-y-2">
              {recommendations.leading_indicators.map((item, idx) => (
                <Card key={idx} className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{item.indicator}</p>
                      <Badge variant="outline" className="shrink-0">
                        {formatFrequency(item.frequency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lagging Indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold">Lagging Indicators (Outcome Measures)</h3>
            </div>
            <div className="space-y-2">
              {recommendations.lagging_indicators.map((item, idx) => (
                <Card key={idx} className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{item.indicator}</p>
                      <Badge variant="outline" className="shrink-0">
                        {formatFrequency(item.frequency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Data Collection Activities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold">Data Collection Activities</h3>
            </div>
            <div className="space-y-2">
              {recommendations.data_collection_activities.map((item, idx) => (
                <Card key={idx} className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{item.activity}</p>
                      <Badge variant="outline" className="shrink-0">
                        {formatFrequency(item.frequency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleApply} 
              className="flex-1"
              disabled={applied}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Applied
                </>
              ) : (
                <>
                  Apply Recommendations
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={getRecommendations}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Get New"
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
