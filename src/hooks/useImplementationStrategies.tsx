import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ImplementationStrategy {
  id: string;
  initiative_id: string;
  eric_category: "enable" | "redesign" | "integrate" | "create";
  strategy_name: string;
  description: string | null;
  target_barrier: string | null;
  responsible_party: string | null;
  timeline: string | null;
  resources_needed: string | null;
  success_indicators: string | null;
  status: "planned" | "in_progress" | "completed" | "on_hold";
  created_at: string;
  updated_at: string;
}

export function useImplementationStrategies(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategies, isLoading } = useQuery({
    queryKey: ["implementation-strategies", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("implementation_strategies")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("eric_category", { ascending: true });

      if (error) throw error;
      return data as ImplementationStrategy[];
    },
    enabled: !!initiativeId,
  });

  const createStrategy = useMutation({
    mutationFn: async (strategy: Partial<ImplementationStrategy>) => {
      const { data, error } = await supabase
        .from("implementation_strategies")
        .insert({
          initiative_id: initiativeId!,
          eric_category: strategy.eric_category!,
          strategy_name: strategy.strategy_name!,
          description: strategy.description,
          target_barrier: strategy.target_barrier,
          responsible_party: strategy.responsible_party,
          timeline: strategy.timeline,
          resources_needed: strategy.resources_needed,
          success_indicators: strategy.success_indicators,
          status: strategy.status || "planned",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementation-strategies", initiativeId] });
      toast({
        title: "Strategy added",
        description: "Implementation strategy has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStrategy = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImplementationStrategy> & { id: string }) => {
      const { data, error } = await supabase
        .from("implementation_strategies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementation-strategies", initiativeId] });
      toast({
        title: "Strategy updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStrategy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("implementation_strategies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementation-strategies", initiativeId] });
      toast({
        title: "Strategy deleted",
        description: "Implementation strategy has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    strategies: strategies || [],
    isLoading,
    createStrategy: createStrategy.mutate,
    updateStrategy: updateStrategy.mutate,
    deleteStrategy: deleteStrategy.mutate,
    isCreating: createStrategy.isPending,
    isUpdating: updateStrategy.isPending,
    isDeleting: deleteStrategy.isPending,
  };
}
