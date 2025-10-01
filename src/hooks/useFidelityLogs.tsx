import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FidelityLog {
  id: string;
  initiative_id: string;
  component_id: string | null;
  observer_id: string;
  rating: number;
  notes: string | null;
  observed_at: string;
  created_at: string;
}

export function useFidelityLogs(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fidelityLogs, isLoading } = useQuery({
    queryKey: ["fidelity-logs", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("fidelity_logs")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("observed_at", { ascending: false });

      if (error) throw error;
      return data as FidelityLog[];
    },
    enabled: !!initiativeId,
  });

  const createLog = useMutation({
    mutationFn: async (log: Omit<FidelityLog, "id" | "created_at" | "observer_id">) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("fidelity_logs")
        .insert({
          initiative_id: initiativeId!,
          component_id: log.component_id,
          rating: log.rating,
          notes: log.notes,
          observed_at: log.observed_at,
          observer_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fidelity-logs", initiativeId] });
      toast({
        title: "Log saved",
        description: "Fidelity log has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    fidelityLogs: fidelityLogs || [],
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
  };
}
