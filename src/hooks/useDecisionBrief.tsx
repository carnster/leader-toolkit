import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DecisionBrief {
  id: string;
  initiative_id: string;
  problem_statement: string;
  target_group: string;
  baseline_data: string | null;
  root_causes: string[] | null;
  goals: string | null;
  equity_notes: string | null;
  stakeholder_input: string | null;
  chosen_approach: string | null;
  evidence_base: string | null;
  feasibility_score: number | null;
  feasibility_factors: any | null;
  leading_indicators: string[] | null;
  lagging_indicators: string[] | null;
  measurement_timeline: string | null;
  checklist_completed: boolean | null;
  goals_feedback: any | null;
  created_at: string;
  updated_at: string;
}

export function useDecisionBrief(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: decisionBrief, isLoading } = useQuery({
    queryKey: ["decision-brief", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from("decision_briefs")
        .select("*")
        .eq("initiative_id", initiativeId)
        .maybeSingle();

      if (error) throw error;
      return data as DecisionBrief | null;
    },
    enabled: !!initiativeId,
  });

  const upsertDecisionBrief = useMutation({
    mutationFn: async (brief: Partial<DecisionBrief>) => {
      const { id, created_at, updated_at, ...briefData } = brief as any;
      
      // Validate required fields
      if (!briefData.problem_statement || briefData.problem_statement.trim() === "") {
        throw new Error("Problem statement is required");
      }
      if (!briefData.target_group || briefData.target_group.trim() === "") {
        throw new Error("Target group is required");
      }
      
      const { data, error } = await supabase
        .from("decision_briefs")
        .upsert({
          initiative_id: initiativeId!,
          problem_statement: briefData.problem_statement.trim(),
          target_group: briefData.target_group.trim(),
          ...briefData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decision-brief", initiativeId] });
      toast({
        title: "Decision brief saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving decision brief",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    decisionBrief,
    isLoading,
    upsertDecisionBrief: upsertDecisionBrief.mutate,
    isSaving: upsertDecisionBrief.isPending,
  };
}
