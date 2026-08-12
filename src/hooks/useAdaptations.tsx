import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingColumn } from "@/lib/missingTable";

/** How far an adaptation reaches into the practice. Escoffery et al. adaptation
 *  taxonomy, via NCI's Implementation Science at a Glance p.12: cosmetic tweaks
 *  are low-review; component and core changes warrant a closer look. */
export type AdaptationScope = "cosmetic" | "component" | "core";

export interface AdaptationRequest {
  id: string;
  initiative_id: string;
  ingredient_id: string | null;
  proposed_by: string;
  description: string;
  rationale: string | null;
  touches_core: boolean;
  adaptation_scope: AdaptationScope | null;
  decision: "pending" | "approved" | "approved_with_conditions" | "rejected";
  decision_rationale: string | null;
  decided_at: string | null;
  created_at: string;
}

export function useAdaptations(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["adaptations", initiativeId];

  const { data: adaptations, isLoading } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adaptation_requests" as any)
        .select("*")
        .eq("initiative_id", initiativeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as AdaptationRequest[]) || [];
    },
  });

  const propose = useMutation({
    mutationFn: async (req: { ingredient_id: string | null; description: string; rationale: string; touches_core: boolean; adaptation_scope: AdaptationScope }) => {
      const row = { ...req, initiative_id: initiativeId! };
      const { error } = await supabase
        .from("adaptation_requests" as any)
        .insert(row);
      if (error) {
        // adaptation_scope may ship before its migration reaches this database.
        // Log the adaptation without the tier rather than losing the whole
        // proposal; touches_core still records the core-vs-not distinction.
        if (isMissingColumn(error)) {
          const { adaptation_scope, ...rest } = row;
          const { error: retryErr } = await supabase.from("adaptation_requests" as any).insert(rest);
          if (retryErr) throw retryErr;
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Adaptation proposed", description: "It is now on the team's docket for a decision." });
    },
    onError: (e: Error) => toast({ title: "Could not propose adaptation", description: e.message, variant: "destructive" }),
  });

  const decide = useMutation({
    mutationFn: async (input: { id: string; decision: AdaptationRequest["decision"]; decision_rationale: string }) => {
      const { data, error } = await supabase
        .from("adaptation_requests" as any)
        .update({ decision: input.decision, decision_rationale: input.decision_rationale, decided_at: new Date().toISOString() })
        .eq("id", input.id)
        .select();
      if (error) throw error;
      if (((data as unknown[] | null) ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Decision recorded", description: "Logged to the adaptation history." });
    },
    onError: (e: Error) => toast({ title: "Could not record decision", description: e.message, variant: "destructive" }),
  });

  return { adaptations: adaptations || [], isLoading, propose: propose.mutate, decide: decide.mutate };
}
