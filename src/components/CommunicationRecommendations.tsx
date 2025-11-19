import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MessageSquare, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommunicationRecommendation {
  stakeholder_group: string;
  activity_type: string;
  description: string;
  channel: string;
  timing: string;
}

interface CommunicationRecommendationsProps {
  decisionBrief: {
    problem_statement: string;
    target_group: string;
    goals?: string;
    chosen_approach?: string;
    stakeholder_input?: string;
    equity_notes?: string;
  };
  teamMembers?: Array<{
    name?: string;
    role_in_initiative: string;
  }>;
  onApplyRecommendations: (recommendations: CommunicationRecommendation[]) => void;
}

export function CommunicationRecommendations({
  decisionBrief,
  teamMembers,
  onApplyRecommendations,
}: CommunicationRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CommunicationRecommendation[]>([]);
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-communication', {
        body: { 
          decisionBrief,
          teamMembers 
        }
      });

      if (error) throw error;

      setRecommendations(data.activities);
      toast({
        title: "Recommendations Generated",
        description: `${data.activities.length} communication activities suggested.`,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplyRecommendations(recommendations);
    setRecommendations([]);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Communication Plan Generator
            </CardTitle>
            <CardDescription className="mt-1.5">
              Generate a strategic stakeholder engagement plan based on your initiative
            </CardDescription>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {recommendations.length > 0 && (
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <Card key={idx} className="border-muted">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                            <Users className="h-3 w-3 mr-1" />
                            {rec.stakeholder_group}
                          </Badge>
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {rec.activity_type}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                            <Calendar className="h-3 w-3 mr-1" />
                            {rec.timing}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{rec.description}</p>
                        <p className="text-xs text-muted-foreground">Channel: {rec.channel}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleApply} className="flex-1">
              Apply All {recommendations.length} Activities
            </Button>
            <Button variant="outline" onClick={() => setRecommendations([])}>
              Dismiss
            </Button>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              💡 Review and adjust timing, channels, and descriptions to fit your school's context before applying.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}