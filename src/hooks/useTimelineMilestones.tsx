import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimelineMilestone {
  id: string;
  initiative_id: string;
  phase: string;
  milestone: string;
  target_date: string;
  status: "pending" | "in_progress" | "completed" | "at_risk";
  completion_date: string | null;
  notes: string | null;
  sub_stage: string | null;
  created_at: string;
  updated_at: string;
}

export function useTimelineMilestones(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["timeline-milestones", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("timeline_milestones")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("target_date", { ascending: true });

      if (error) throw error;
      return data as TimelineMilestone[];
    },
    enabled: !!initiativeId,
  });

  const createMilestone = useMutation({
    mutationFn: async (milestone: Partial<TimelineMilestone>) => {
      const { data, error } = await supabase
        .from("timeline_milestones")
        .insert({
          initiative_id: initiativeId!,
          phase: milestone.phase!,
          milestone: milestone.milestone!,
          target_date: milestone.target_date!,
          status: milestone.status || "pending",
          notes: milestone.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-milestones", initiativeId] });
      toast({
        title: "Milestone added",
        description: "Timeline milestone has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimelineMilestone> & { id: string }) => {
      const { data, error } = await supabase
        .from("timeline_milestones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-milestones", initiativeId] });
      toast({
        title: "Milestone updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timeline_milestones")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-milestones", initiativeId] });
      toast({
        title: "Milestone deleted",
        description: "Timeline milestone has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    milestones: milestones || [],
    isLoading,
    createMilestone: createMilestone.mutate,
    updateMilestone: updateMilestone.mutate,
    deleteMilestone: deleteMilestone.mutate,
    isCreating: createMilestone.isPending,
    isUpdating: updateMilestone.isPending,
    isDeleting: deleteMilestone.isPending,
  };
}
