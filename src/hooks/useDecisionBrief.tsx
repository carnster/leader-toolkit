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
  measurement_timeline: string[] | null;
  checklist_completed: boolean | null;
  goals_feedback: any | null;
  equity_checklist: { checked: Record<string, boolean>; notes: Record<string, string> } | null;
  created_at: string;
  updated_at: string;
}

export function useDecisionBrief(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: decisionBrief, isLoading, error, isError } = useQuery({
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

      // A save often carries only the fields that changed on one tab, so the
      // problem statement and target group are usually absent even though they
      // are already saved. Backfill both from the stored brief before
      // validating, so a partial update never fails for fields the user
      // already filled in. Only a genuinely new, still-empty brief is rejected.
      let existing: { problem_statement?: string | null; target_group?: string | null } | null = null;
      if (initiativeId) {
        const { data: current } = await supabase
          .from("decision_briefs")
          .select("problem_statement, target_group")
          .eq("initiative_id", initiativeId)
          .maybeSingle();
        existing = current as typeof existing;
      }

      const problem_statement = String(briefData.problem_statement ?? existing?.problem_statement ?? "").trim();
      const target_group = String(briefData.target_group ?? existing?.target_group ?? "").trim();

      // Validate required fields
      if (!problem_statement) {
        throw new Error("Problem statement is required");
      }
      if (!target_group) {
        throw new Error("Target group is required");
      }

      const { data, error } = await supabase
        .from("decision_briefs")
        .upsert({
          initiative_id: initiativeId!,
          ...briefData,
          problem_statement,
          target_group,
        }, {
          onConflict: 'initiative_id'
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
    error,
    isError,
    upsertDecisionBrief: upsertDecisionBrief.mutate,
    upsertDecisionBriefAsync: upsertDecisionBrief.mutateAsync,
    isSaving: upsertDecisionBrief.isPending,
  };
}
