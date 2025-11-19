import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MessageSquare, Calendar, Users, Check } from "lucide-react";
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
  decisionBrief: any;
  teamMembers?: any[];
  onApplyRecommendations: (recommendations: CommunicationRecommendation[]) => void;
}

export function CommunicationRecommendations({
  decisionBrief,
  teamMembers,
  onApplyRecommendations,
}: CommunicationRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CommunicationRecommendation[]>([]);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setIsLoading(true);
    setAppliedIndices(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('recommend-communication', {
        body: { decisionBrief, teamMembers }
      });
      if (error) throw error;
      setRecommendations(data.activities);
      toast({ title: "Recommendations Generated", description: `${data.activities.length} communication activities suggested.` });
    } catch (error) {
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "Could not generate recommendations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOne = (rec: CommunicationRecommendation, idx: number) => {
    onApplyRecommendations([rec]);
    setAppliedIndices(prev => new Set(prev).add(idx));
  };

  const handleApplyAll = () => {
    const unapplied = recommendations.filter((_, idx) => !appliedIndices.has(idx));
    onApplyRecommendations(unapplied);
    setRecommendations([]);
    setAppliedIndices(new Set());
  };

  const unappliedCount = recommendations.filter((_, idx) => !appliedIndices.has(idx)).length;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Communication Plan Generator
            </CardTitle>
            <CardDescription>Generate strategic stakeholder engagement based on your initiative</CardDescription>
          </div>
          <Button onClick={generateRecommendations} disabled={isLoading} size="sm">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Plan</>}
          </Button>
        </div>
      </CardHeader>
      {recommendations.length > 0 && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{recommendations.length} activities • {appliedIndices.size} applied</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setRecommendations([]); setAppliedIndices(new Set()); }} size="sm">Discard All</Button>
              {unappliedCount > 0 && <Button onClick={handleApplyAll} size="sm">Apply {unappliedCount} Remaining</Button>}
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const isApplied = appliedIndices.has(idx);
              return (
                <Card key={idx} className={isApplied ? "opacity-50" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{rec.stakeholder_group}</Badge>
                          <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />{rec.activity_type}</Badge>
                          <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{rec.timing}</Badge>
                          {isApplied && <Badge variant="secondary"><Check className="h-3 w-3 mr-1" />Applied</Badge>}
                        </div>
                        <p className="text-sm font-medium">{rec.description}</p>
                        <p className="text-xs text-muted-foreground">Channel: {rec.channel}</p>
                      </div>
                      <Button variant={isApplied ? "ghost" : "default"} size="sm" onClick={() => handleApplyOne(rec, idx)} disabled={isApplied}>
                        <Check className="h-4 w-4" />{isApplied ? "Applied" : "Accept"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
