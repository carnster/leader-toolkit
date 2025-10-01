import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SustainabilityPlan {
  id: string;
  initiative_id: string;
  embedding_routines: any | null;
  onboarding_resources: any | null;
  resource_protections: any | null;
  scale_readiness_score: number | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
}

export function useSustainabilityPlan(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sustainabilityPlan, isLoading } = useQuery({
    queryKey: ["sustainability-plan", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from("sustainability_plans")
        .select("*")
        .eq("initiative_id", initiativeId)
        .maybeSingle();

      if (error) throw error;
      return data as SustainabilityPlan | null;
    },
    enabled: !!initiativeId,
  });

  const upsertPlan = useMutation({
    mutationFn: async (plan: Partial<SustainabilityPlan>) => {
      const { data, error } = await supabase
        .from("sustainability_plans")
        .upsert({
          initiative_id: initiativeId!,
          ...plan,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sustainability-plan", initiativeId] });
      toast({
        title: "Plan saved",
        description: "Sustainability plan has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sustainabilityPlan,
    isLoading,
    upsertPlan: upsertPlan.mutate,
    isSaving: upsertPlan.isPending,
  };
}
