import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// JSONB shapes for the sustainability_plans table.
// embedding_routines: EmbeddingRoutine[]
// onboarding_resources: OnboardingResource[]
// resource_protections: ResourceProtectionsData (object holding protections,
//   the sustainability checklist state, and scale readiness ratings)

export interface EmbeddingRoutine {
  id: string;
  name: string;
  schedule: string;
  owner: string;
}

export type OnboardingStatus = "planned" | "in_progress" | "complete";

export interface OnboardingResource {
  id: string;
  name: string;
  status: OnboardingStatus;
}

export type ProtectionCategory = "time" | "budget" | "staffing";

export interface ResourceProtection {
  id: string;
  category: ProtectionCategory;
  text: string;
}

export type ScaleReadinessRating = "not_yet" | "moderate" | "strong";

export interface ResourceProtectionsData {
  protections: ResourceProtection[];
  /** Sustainability checklist state, keyed by checklist item id */
  checklist: Record<string, boolean>;
  /** Scale readiness self-assessment, keyed by dimension id */
  scaleReadiness: Record<string, ScaleReadinessRating>;
}

export interface SustainabilityPlan {
  id: string;
  initiative_id: string;
  embedding_routines: EmbeddingRoutine[] | null;
  onboarding_resources: OnboardingResource[] | null;
  resource_protections: ResourceProtectionsData | null;
  scale_readiness_score: number | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
}

export type SustainabilityPlanUpdates = Partial<
  Pick<
    SustainabilityPlan,
    | "embedding_routines"
    | "onboarding_resources"
    | "resource_protections"
    | "scale_readiness_score"
    | "next_steps"
  >
> & {
  /** Skip the success toast (for high-frequency saves like checkbox toggles) */
  _silent?: boolean;
};

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
      return data as unknown as SustainabilityPlan | null;
    },
    enabled: !!initiativeId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: SustainabilityPlanUpdates) => {
      if (!initiativeId) throw new Error("No initiative selected");
      const { _silent, ...planData } = updates;

      const { data, error } = await supabase
        .from("sustainability_plans")
        .upsert(
          {
            initiative_id: initiativeId,
            ...planData,
          } as any,
          { onConflict: "initiative_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SustainabilityPlan;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sustainability-plan", initiativeId] });
      if (!variables._silent) {
        toast({
          title: "Sustainability plan saved",
          description: "Your changes have been saved.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving sustainability plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sustainabilityPlan,
    isLoading,
    upsertPlan: upsertMutation.mutate,
    isSaving: upsertMutation.isPending,
  };
}
