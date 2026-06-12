import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ImplementationRisk {
  id: string;
  initiative_id: string;
  risk_description: string;
  risk_category: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation_strategy: string;
  contingency_plan: string | null;
  status: "active" | "mitigated" | "occurred" | "resolved";
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useImplementationRisks(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: risks, isLoading } = useQuery({
    queryKey: ["implementation-risks", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("implementation_risks")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ImplementationRisk[];
    },
    enabled: !!initiativeId,
  });

  const createRisk = useMutation({
    mutationFn: async (risk: Partial<ImplementationRisk>) => {
      const { data, error } = await supabase
        .from("implementation_risks")
        .insert({
          initiative_id: initiativeId!,
          risk_description: risk.risk_description!,
          risk_category: risk.risk_category!,
          likelihood: risk.likelihood!,
          impact: risk.impact!,
          mitigation_strategy: risk.mitigation_strategy!,
          contingency_plan: risk.contingency_plan,
          owner_id: risk.owner_id,
          status: risk.status || "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementation-risks", initiativeId] });
      toast({
        title: "Risk added",
        description: "Implementation risk has been documented.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRisk = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImplementationRisk> & { id: string }) => {
      const { data, error } = await supabase
        .from("implementation_risks")
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
      queryClient.invalidateQueries({ queryKey: ["implementation-risks", initiativeId] });
      toast({
        title: "Risk updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRisk = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("implementation_risks")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["implementation-risks", initiativeId] });
      toast({
        title: "Risk deleted",
        description: "Implementation risk has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    risks: risks || [],
    isLoading,
    createRisk: createRisk.mutate,
    updateRisk: updateRisk.mutate,
    deleteRisk: deleteRisk.mutate,
    isCreating: createRisk.isPending,
    isUpdating: updateRisk.isPending,
    isDeleting: deleteRisk.isPending,
  };
}
