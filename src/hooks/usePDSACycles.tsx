import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PDSACycle {
  id: string;
  initiative_id: string;
  cycle_number: number;
  aim: string;
  change_idea: string;
  test_window_start: string | null;
  test_window_end: string | null;
  status: "planning" | "testing" | "complete";
  results: string | null;
  decision: string | null;
  created_at: string;
  updated_at: string;
}

export function usePDSACycles(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pdsaCycles, isLoading } = useQuery({
    queryKey: ["pdsa-cycles", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("pdsa_cycles")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("cycle_number", { ascending: false });

      if (error) throw error;
      return data as PDSACycle[];
    },
    enabled: !!initiativeId,
  });

  const createCycle = useMutation({
    mutationFn: async (cycle: Partial<PDSACycle>) => {
      const maxCycleNumber = pdsaCycles?.length 
        ? Math.max(...pdsaCycles.map(c => c.cycle_number))
        : 0;

      const { data, error } = await supabase
        .from("pdsa_cycles")
        .insert({
          initiative_id: initiativeId!,
          cycle_number: maxCycleNumber + 1,
          aim: cycle.aim!,
          change_idea: cycle.change_idea!,
          test_window_start: cycle.test_window_start,
          test_window_end: cycle.test_window_end,
          status: cycle.status || "planning",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa-cycles", initiativeId] });
      toast({
        title: "PDSA cycle created",
        description: "New improvement cycle has been started.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating cycle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PDSACycle> & { id: string }) => {
      const { data, error } = await supabase
        .from("pdsa_cycles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa-cycles", initiativeId] });
      toast({
        title: "Cycle updated",
        description: "PDSA cycle has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating cycle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pdsaCycles: pdsaCycles || [],
    isLoading,
    createCycle: createCycle.mutate,
    updateCycle: updateCycle.mutate,
    isCreating: createCycle.isPending,
    isUpdating: updateCycle.isPending,
  };
}
