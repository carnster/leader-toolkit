import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommunicationActivity {
  id: string;
  initiative_id: string;
  stakeholder_group: string;
  activity_type: string;
  description: string;
  channel: string | null;
  scheduled_date: string | null;
  completed: boolean;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommunicationActivities(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["communication-activities", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("communication_activities")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("scheduled_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as CommunicationActivity[];
    },
    enabled: !!initiativeId,
  });

  const createActivity = useMutation({
    mutationFn: async (activity: Partial<CommunicationActivity>) => {
      const { data, error } = await supabase
        .from("communication_activities")
        .insert({
          initiative_id: initiativeId!,
          stakeholder_group: activity.stakeholder_group!,
          activity_type: activity.activity_type!,
          description: activity.description!,
          channel: activity.channel,
          scheduled_date: activity.scheduled_date,
          completed: activity.completed ?? false,
          completed_date: activity.completed_date,
          notes: activity.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-activities", initiativeId] });
      toast({
        title: "Activity added",
        description: "Communication activity has been scheduled.",
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
    mutationFn: async ({ id, ...updates }: Partial<CommunicationActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from("communication_activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-activities", initiativeId] });
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
      const { error } = await supabase
        .from("communication_activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-activities", initiativeId] });
      toast({
        title: "Activity deleted",
        description: "Communication activity has been removed.",
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
