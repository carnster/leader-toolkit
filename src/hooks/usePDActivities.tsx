import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PDActivity {
  id: string;
  initiative_id: string;
  activity_type: "initial_training" | "ongoing_coaching" | "collaborative_learning" | "external_workshop" | "self_directed";
  title: string;
  description: string | null;
  facilitator: string | null;
  facilitator_id: string | null;
  target_audience: string[] | null;
  scheduled_date: string | null;
  duration_minutes: number | null;
  completion_status: "planned" | "completed" | "cancelled";
  attendance_count: number | null;
  fidelity_focus: string[] | null;
  created_at: string;
  updated_at: string;
}

export function usePDActivities(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["pd-activities", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("pd_activities")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("scheduled_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as PDActivity[];
    },
    enabled: !!initiativeId,
  });

  const createActivity = useMutation({
    mutationFn: async (activity: Partial<PDActivity>) => {
      const { data, error } = await supabase
        .from("pd_activities")
        .insert({
          initiative_id: initiativeId!,
          activity_type: activity.activity_type!,
          title: activity.title!,
          description: activity.description,
          facilitator: activity.facilitator,
          facilitator_id: activity.facilitator_id,
          target_audience: activity.target_audience,
          scheduled_date: activity.scheduled_date,
          duration_minutes: activity.duration_minutes,
          completion_status: activity.completion_status || "planned",
          attendance_count: activity.attendance_count,
          fidelity_focus: activity.fidelity_focus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pd-activities", initiativeId] });
      toast({
        title: "PD activity added",
        description: "Professional development activity has been scheduled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PDActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from("pd_activities")
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
      queryClient.invalidateQueries({ queryKey: ["pd-activities", initiativeId] });
      toast({
        title: "Activity updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pd_activities")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pd-activities", initiativeId] });
      toast({
        title: "Activity deleted",
        description: "PD activity has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    activities: activities || [],
    isLoading,
    createActivity: createActivity.mutate,
    updateActivity: updateActivity.mutate,
    deleteActivity: deleteActivity.mutate,
    isCreating: createActivity.isPending,
    isUpdating: updateActivity.isPending,
    isDeleting: deleteActivity.isPending,
  };
}
