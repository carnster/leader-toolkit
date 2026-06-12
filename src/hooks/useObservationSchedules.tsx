import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ObservationSchedule {
  id: string;
  initiative_id: string;
  active_ingredient_id: string | null;
  observer_id: string | null;
  implementer_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number | null;
  observation_type: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  location: string | null;
  notes: string | null;
  completed_observation_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useObservationSchedules(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["observation-schedules", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("observation_schedules")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as ObservationSchedule[];
    },
    enabled: !!initiativeId,
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: Omit<ObservationSchedule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("observation_schedules")
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-schedules", initiativeId] });
      toast({
        title: "Observation scheduled",
        description: "Observation has been added to the calendar.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling observation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ObservationSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("observation_schedules")
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
      queryClient.invalidateQueries({ queryKey: ["observation-schedules", initiativeId] });
      toast({
        title: "Observation updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating observation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("observation_schedules")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-schedules", initiativeId] });
      toast({
        title: "Observation deleted",
        description: "Observation has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting observation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    createSchedule: createSchedule.mutate,
    updateSchedule: updateSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
  };
}
