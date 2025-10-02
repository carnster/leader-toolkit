import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimeCommitment {
  id: string;
  initiative_id: string;
  role_name: string;
  hours_per_week: number | null;
  hours_per_month: number | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTimeCommitments(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timeCommitments, isLoading } = useQuery({
    queryKey: ["time-commitments", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("time_commitments")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("role_name", { ascending: true });

      if (error) throw error;
      return data as TimeCommitment[];
    },
    enabled: !!initiativeId,
  });

  const createTimeCommitment = useMutation({
    mutationFn: async (item: Omit<TimeCommitment, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("time_commitments")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-commitments", initiativeId] });
      toast({
        title: "Time commitment added",
        description: "Time commitment has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating time commitment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTimeCommitment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeCommitment> & { id: string }) => {
      const { data, error } = await supabase
        .from("time_commitments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-commitments", initiativeId] });
      toast({
        title: "Time commitment updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating time commitment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTimeCommitment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_commitments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-commitments", initiativeId] });
      toast({
        title: "Time commitment deleted",
        description: "Time commitment has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting time commitment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    timeCommitments: timeCommitments || [],
    isLoading,
    createTimeCommitment: createTimeCommitment.mutate,
    updateTimeCommitment: updateTimeCommitment.mutate,
    deleteTimeCommitment: deleteTimeCommitment.mutate,
    isCreating: createTimeCommitment.isPending,
    isUpdating: updateTimeCommitment.isPending,
    isDeleting: deleteTimeCommitment.isPending,
  };
}
