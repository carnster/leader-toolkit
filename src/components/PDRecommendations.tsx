import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PDRecommendation {
  activity_type: string;
  title: string;
  description: string;
  facilitator: string;
  target_audience: string[];
  scheduled_date: string | null;
  duration_minutes: number;
  fidelity_focus: string[];
}

interface PDRecommendationsProps {
  initiativeId: string;
  activeIngredients: Array<{
    name: string;
    is_core: boolean;
    look_fors: string[] | null;
  }>;
  teamMembers: Array<{
    role_in_initiative: string;
  }>;
  onApplyRecommendations: (recommendations: PDRecommendation[]) => void;
}

const activityTypeLabels: Record<string, string> = {
  initial_training: "Initial Training",
  ongoing_coaching: "Ongoing Coaching",
  collaborative_learning: "Collaborative Learning",
  external_workshop: "External Workshop",
  self_directed: "Self-Directed Learning"
};

export function PDRecommendations({
  initiativeId,
  activeIngredients,
  teamMembers,
  onApplyRecommendations,
}: PDRecommendationsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<PDRecommendation[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (activeIngredients.length === 0) {
      toast({
        title: "Active ingredients needed",
        description: "Please add active ingredients before generating PD recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-pd", {
        body: {
          activeIngredients: activeIngredients.map(ai => ({
            name: ai.name,
            is_core: ai.is_core,
            look_fors: ai.look_fors || []
          })),
          teamMembers: teamMembers.map(tm => ({
            role_in_initiative: tm.role_in_initiative
          }))
        },
      });

      if (error) throw error;

      setRecommendations(data.activities || []);
      toast({
        title: "PD activities generated",
        description: `Generated ${data.activities?.length || 0} professional development recommendations.`,
      });
    } catch (error: any) {
      console.error("Error generating PD recommendations:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate PD recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onApplyRecommendations(recommendations);
    setRecommendations([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI PD Recommendations
        </CardTitle>
        <CardDescription>
          Generate professional development activities based on your active ingredients and team composition
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
                {recommendations.length} activities generated
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRecommendations([])}>
                  Discard
                </Button>
                <Button onClick={handleApply}>
                  <CheckCircle2 className="h-4 w-4" />
                  Apply All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {activityTypeLabels[activity.activity_type] || activity.activity_type}
                          </Badge>
                          {activity.duration_minutes && (
                            <span className="text-xs text-muted-foreground">
                              {activity.duration_minutes} min
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        {activity.facilitator && (
                          <p className="text-sm">
                            <span className="font-medium">Facilitator:</span> {activity.facilitator}
                          </p>
                        )}
                        {activity.target_audience && activity.target_audience.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-sm font-medium">Target:</span>
                            {activity.target_audience.map((audience, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {audience}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {activity.fidelity_focus && activity.fidelity_focus.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-sm font-medium">Focus:</span>
                            {activity.fidelity_focus.map((focus, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {focus}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
