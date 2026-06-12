import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ActiveIngredient {
  id: string;
  initiative_id: string;
  name: string;
  category: string | null;
  description: string | null;
  is_core: boolean;
  look_fors: string[] | null;
  adaptable_boundaries: string[] | null;
  created_at: string;
}

export function useActiveIngredients(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeIngredients, isLoading } = useQuery({
    queryKey: ["active-ingredients", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("active_ingredients")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("is_core", { ascending: false });

      if (error) throw error;
      return data as ActiveIngredient[];
    },
    enabled: !!initiativeId,
  });

  const createIngredient = useMutation({
    mutationFn: async (ingredient: Partial<ActiveIngredient>) => {
      const { data, error } = await supabase
        .from("active_ingredients")
        .insert({
          initiative_id: initiativeId!,
          name: ingredient.name!,
          category: ingredient.category,
          description: ingredient.description,
          is_core: ingredient.is_core ?? true,
          look_fors: ingredient.look_fors,
          adaptable_boundaries: ingredient.adaptable_boundaries,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });
      toast({
        title: "Ingredient added",
        description: "Active ingredient has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIngredient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ActiveIngredient> & { id: string }) => {
      const { data, error } = await supabase
        .from("active_ingredients")
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
      queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });
      toast({
        title: "Ingredient updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteIngredient = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("active_ingredients")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-ingredients", initiativeId] });
      toast({
        title: "Ingredient deleted",
        description: "Active ingredient has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    activeIngredients: activeIngredients || [],
    isLoading,
    createIngredient: createIngredient.mutate,
    updateIngredient: updateIngredient.mutate,
    deleteIngredient: deleteIngredient.mutate,
    isCreating: createIngredient.isPending,
    isUpdating: updateIngredient.isPending,
    isDeleting: deleteIngredient.isPending,
  };
}
