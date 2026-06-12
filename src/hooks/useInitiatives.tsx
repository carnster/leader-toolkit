import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Initiative {
  id: string;
  title: string;
  description: string | null;
  stage: "decide" | "plan" | "implement" | "monitor" | "sustain";
  status: "active" | "on_hold" | "completed" | "archived";
  owner_id: string;
  start_date: string | null;
  target_end_date: string | null;
  context_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useInitiatives() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: initiatives, isLoading, error } = useQuery({
    queryKey: ["initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Initiative[];
    },
  });

  const createInitiative = useMutation({
    mutationFn: async (initiative: Partial<Initiative>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("initiatives")
        .insert([{
          title: initiative.title!,
          description: initiative.description,
          stage: initiative.stage || "decide",
          status: initiative.status || "active",
          owner_id: userData.user.id,
          start_date: initiative.start_date,
          target_end_date: initiative.target_end_date,
          context_tags: initiative.context_tags,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Initiative created",
        description: "Your initiative has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInitiative = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Initiative> & { id: string }) => {
      const { data, error } = await supabase
        .from("initiatives")
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
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Initiative updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInitiative = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("initiatives")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Initiative deleted",
        description: "The initiative has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    initiatives: initiatives || [],
    isLoading,
    error,
    createInitiative: createInitiative.mutate,
    updateInitiative: updateInitiative.mutate,
    deleteInitiative: deleteInitiative.mutate,
    isCreating: createInitiative.isPending,
    isUpdating: updateInitiative.isPending,
    isDeleting: deleteInitiative.isPending,
  };
}
