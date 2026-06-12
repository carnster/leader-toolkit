import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChecklistItem {
  id: string;
  indicator: string;
  description?: string;
}

export interface RatingScale {
  min: number;
  max: number;
  labels: string[];
}

export interface FidelityChecklist {
  id: string;
  initiative_id: string;
  active_ingredient_id: string;
  name: string;
  description: string | null;
  checklist_items: ChecklistItem[];
  rating_scale: RatingScale;
  created_at: string;
  updated_at: string;
}

export function useFidelityChecklists(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checklists, isLoading } = useQuery({
    queryKey: ["fidelity-checklists", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("fidelity_checklists")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        checklist_items: item.checklist_items as unknown as ChecklistItem[],
        rating_scale: item.rating_scale as unknown as RatingScale,
      })) as FidelityChecklist[];
    },
    enabled: !!initiativeId,
  });

  const createChecklist = useMutation({
    mutationFn: async (checklist: Omit<FidelityChecklist, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("fidelity_checklists")
        .insert({
          ...checklist,
          checklist_items: checklist.checklist_items as any,
          rating_scale: checklist.rating_scale as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fidelity-checklists", initiativeId] });
      toast({
        title: "Checklist created",
        description: "Fidelity checklist has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateChecklist = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FidelityChecklist> & { id: string }) => {
      const updateData: any = { ...updates };
      if (updates.checklist_items) {
        updateData.checklist_items = updates.checklist_items as any;
      }
      if (updates.rating_scale) {
        updateData.rating_scale = updates.rating_scale as any;
      }
      
      const { data, error } = await supabase
        .from("fidelity_checklists")
        .update(updateData)
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
      queryClient.invalidateQueries({ queryKey: ["fidelity-checklists", initiativeId] });
      toast({
        title: "Checklist updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("fidelity_checklists")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fidelity-checklists", initiativeId] });
      toast({
        title: "Checklist deleted",
        description: "Fidelity checklist has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    checklists: checklists || [],
    isLoading,
    createChecklist: createChecklist.mutate,
    updateChecklist: updateChecklist.mutate,
    deleteChecklist: deleteChecklist.mutate,
    isCreating: createChecklist.isPending,
    isUpdating: updateChecklist.isPending,
    isDeleting: deleteChecklist.isPending,
  };
}
