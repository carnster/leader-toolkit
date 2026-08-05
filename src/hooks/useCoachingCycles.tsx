import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/missingTable";

export type CoachingStage = "observation" | "feedback" | "follow_up" | "closed";
export type CoachingOutcome = "moved" | "partly" | "not_yet";

export interface CoachingCycle {
  id: string;
  initiative_id: string;
  member_name: string;
  member_id: string | null;
  focus_ingredient_id: string | null;
  stage: CoachingStage;
  observation_notes: string | null;
  observed_at: string | null;
  feedback_notes: string | null;
  next_step: string | null;
  commitment_id: string | null;
  follow_up_date: string | null;
  outcome: CoachingOutcome | null;
  created_at: string;
  closed_at: string | null;
}

/** Observation -> feedback -> one agreed next step -> follow-up. The driver
 *  that turns PD into classroom practice; the next step is recorded as a
 *  commitment so the coaching queue and the support queue are one list. */
export function useCoachingCycles(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["coaching-cycles", initiativeId];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_cycles" as any)
        .select("*")
        .eq("initiative_id", initiativeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CoachingCycle[]) || [];
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const start = useMutation({
    mutationFn: async (input: { member_name: string; member_id?: string | null; focus_ingredient_id?: string | null }) => {
      const { data, error } = await supabase
        .from("coaching_cycles" as any)
        .insert({
          initiative_id: initiativeId,
          member_name: input.member_name.trim(),
          member_id: input.member_id || null,
          focus_ingredient_id: input.focus_ingredient_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CoachingCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Coaching cycle started", description: "Next: log the observation." });
    },
    onError: (e: Error) => toast({ title: "Could not start the cycle", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string } & Partial<Omit<CoachingCycle, "id" | "initiative_id" | "created_at">>) => {
      const { id, ...fields } = input;
      const { data, error } = await supabase
        .from("coaching_cycles" as any)
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select();
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) throw new Error("Only the initiative owner or team can do this.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["commitments", initiativeId] });
    },
    onError: (e: Error) => toast({ title: "Could not update the cycle", description: e.message, variant: "destructive" }),
  });

  const cycles = data || [];
  return {
    cycles,
    openCycles: cycles.filter((c) => c.stage !== "closed"),
    isLoading,
    error,
    missingTable: isMissingTable(error),
    start: start.mutate,
    isStarting: start.isPending,
    update: update.mutate,
    updateAsync: update.mutateAsync,
    isUpdating: update.isPending,
  };
}
